
const express = require("express");
const slugify = require("slugify");
const expError = require("../expressError")
const datbs = require("../db");

let router = new express.Router();

router.get("/", async function (rq, rs, nx) {
  try {
    const resl = await datbs.query(
          `SELECT code, name 
           FROM companies 
           ORDER BY name`
    );

    return rs.json({"companies": resl.rows});
  }

  catch (err) {
    return nx(err);
  }
});


router.get("/:code", async function (rq, rs, nx) {
  try {
    let code = rq.params.code;

    const compresl = await datbs.query(
          `SELECT code, name, description
           FROM companies
           WHERE code = $1`,
        [code]
    );

    const invresl = await datbs.query(
          `SELECT id
           FROM invoices
           WHERE comp_code = $1`,
        [code]
    );

    if (compresl.rows.length === 0) {
      throw new expError(`Company ${code} does not exist`, 404)
    }

    const company = compresl.rows[0];
    const invoices = invresl.rows;

    company.invoices = invoices.map(inv => inv.id);

    return rs.json({"company": company});
  }

  catch (err) {
    return nx(err);
  }
});

router.post("/", async function (rq, rs, nx) {
  try {
    let {name, description} = rq.body;
    let code = slugify(name, {lower: true});

    const resl = await datbs.query(
          `INSERT INTO companies (code, name, description) 
           VALUES ($1, $2, $3) 
           RETURNING code, name, description`,
        [code, name, description]);

    return rs.status(201).json({"company": resl.rows[0]});
  }

  catch (err) {
    return nx(err);
  }
});

router.put("/:code", async function (rq, rs, nx) {
  try {
    let {name, description} = rq.body;
    let code = rq.params.code;

    const resl = await datbs.query(
          `UPDATE companies
           SET name=$1, description=$2
           WHERE code = $3
           RETURNING code, name, description`,
        [name, description, code]);

    if (resl.rows.length === 0) {
      throw new expError(`Company ${code} does not exist`, 404)
    } else {
      return rs.json({"company": resl.rows[0]});
    }
  }

  catch (err) {
    return nx(err);
  }

});


router.delete("/:code", async function (rq, rs, nx) {
  try {
    let code = rq.params.code;

    const resl = await datbs.query(
          `DELETE FROM companies
           WHERE code=$1
           RETURNING code`,
        [code]);

    if (resl.rows.length == 0) {
      throw new expError(`Company ${code} does not exist`, 404)
    } else {
      return rs.json({"status": "deleted"});
    }
  }

  catch (err) {
    return nx(err);
  }
});


module.exports = router;
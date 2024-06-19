const express = require("express");
const expError = require("../expressError")
const datbs = require("../db");

let router = new express.Router();


router.get("/", async function (rq, rs, nx) {
  try {
    const resl = await datbs.query(
          `SELECT id, comp_code
           FROM invoices 
           ORDER BY id`
    );

    return rs.json({"invoices": resl.rows});
  }

  catch (err) {
    return nx(err);
  }
});

router.get("/:id", async function (rq, rs, nx) {
  try {
    let id = rq.params.id;

    const resl = await datbs.query(
          `SELECT i.id, 
                  i.comp_code, 
                  i.amt, 
                  i.paid, 
                  i.add_date, 
                  i.paid_date, 
                  c.name, 
                  c.description 
           FROM invoices AS i
             INNER JOIN companies AS c ON (i.comp_code = c.code)  
           WHERE id = $1`,
        [id]);

    if (resl.rows.length === 0) {
      throw new expError(`Invoice ${id} does not exist`,404);
    }

    const data = resl.rows[0];
    const invoice = {
      id: data.id,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
    };

    return rs.json({"invoice": invoice});
  }

  catch (err) {
    return nx(err);
  }
});

router.post("/", async function (rq, rs, nx) {
  try {
    let {comp_code, amt} = rq.body;

    const resl = await datbs.query(
          `INSERT INTO invoices (comp_code, amt) 
           VALUES ($1, $2) 
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt]);

    return rs.json({"invoice": resl.rows[0]});
  }

  catch (err) {
    return nx(err);
  }
});


router.put("/:id", async function (rq, rs, nx) {
  try {
    let {amt, paid} = rq.body;
    let id = rq.params.id;
    let paidDate = null;

    const currresl = await datbs.query(
          `SELECT paid
           FROM invoices
           WHERE id = $1`,
        [id]);

    if (currresl.rows.length === 0) {
      throw new expError(`Invoice ${id} does not exist`, 404);
    }

    const currPaidDate = currresl.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null
    } else {
      paidDate = currPaidDate;
    }

    const resl = await datbs.query(
          `UPDATE invoices
           SET amt=$1, paid=$2, paid_date=$3
           WHERE id=$4
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, paid, paidDate, id]);

    return rs.json({"invoice": resl.rows[0]});
  }

  catch (err) {
    return nx(err);
  }

});

router.delete("/:id", async function (rq, rs, nx) {
  try {
    let id = rq.params.id;

    const resl = await datbs.query(
          `DELETE FROM invoices
           WHERE id = $1
           RETURNING id`,
        [id]);

    if (resl.rows.length === 0) {
      throw new expError(`Invoice ${id} does not exist`, 404);
    }

    return rs.json({"status": "deleted"});
  }

  catch (err) {
    return nx(err);
  }
});


module.exports = router;
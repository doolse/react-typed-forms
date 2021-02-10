import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setTimeout(() => {
    const { value } = req.body;
    if (value === "OK") {
      return res.send({});
    }
    res.send({ error: `Error: "${value}" is not "OK"` });
  }, 1000);
}

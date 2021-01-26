export function compareJson(
  compare: object
): (jq: JQuery<HTMLPreElement>) => void {
  return (jq) => {
    expect(JSON.parse(jq[0].textContent)).to.deep.equal(compare);
  };
}

export function valMessage(msg: string): (jq: JQuery<HTMLElement>) => void {
  return (jq) => {
    expect((jq[0] as HTMLInputElement).validationMessage).to.eq(msg);
  };
}

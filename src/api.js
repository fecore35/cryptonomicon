export async function getSimilarTickers() {
  const f = await fetch(
    `https://min-api.cryptocompare.com/data/all/coinlist?summary=true`
  );
  const { Data } = await f.json();

  return Object.entries(Data).map(([, value]) => value);
}

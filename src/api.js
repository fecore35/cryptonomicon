const API_KEY =
  "8b02e9c516bc699a72987eedb2e6f81645afedd6a7794d4489320409b1de048a";
const messageType = {
  AGGREGATE_INDEX: "5",
  INVALID_SUB: "500",
};
const tickersHandlers = new Map(); // {}
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

export const uncorrectedTickers = new Array();

export async function getSimilarTickers() {
  const f = await fetch(
    `https://min-api.cryptocompare.com/data/all/coinlist?summary=true`
  );
  const { Data } = await f.json();

  return Object.entries(Data).map(([, value]) => value);
}

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    PARAMETER: parameter,
  } = JSON.parse(e.data);

  if (type === messageType.INVALID_SUB) {
    return uncorrectedTickers.push(parameter.split("~")[2]);
  }

  if (type !== messageType.AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

function unsubscribeFromTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker);
};

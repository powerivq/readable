const express = require("express")
const url = require("url");
const path = require("path");
const rq = require("request");
const http = require("http");
const Readability = require("readability");
const { JSDOM } = require("jsdom");

const port = process.env.PORT || 80;
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36";

http.globalAgent.keepAlive = true;

const formatDigits = (num, digit) => {
  var ans = "" + num;
  while (ans.length < digit) {
    ans = "0" + ans;
  }
  return ans;
}

const logMessage = message => {
  var date = new Date();
  console.log(`[${date.getUTCFullYear()}/${date.getUTCMonth()}/${date.getUTCDate()} ${date.getUTCHours()}:${formatDigits(date.getUTCMinutes(), 2)}:${formatDigits(date.getUTCSeconds(), 2)}.${formatDigits(date.getUTCMilliseconds(), 3)}] ${message}`);
}

const respondError = (response, error, detail) => {
  var responseJson = {
    status: "fail",
    error: error,
    detail: detail
  }
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(responseJson));
}

const handleHtml = (resourceUrl, rawHtml, response) => {
  var doc = new JSDOM(rawHtml, {
    features: {    
      FetchExternalResources: false,
      ProcessExternalResources: false
    }
  });
  logMessage(`${resourceUrl}: JSDOM completed`);

  var article = new Readability(doc.window.document).parse();
  if (!article) {
    respondError(response, "PARSE_FAILURE", "Readability returned empty");
    return;
  }

  logMessage(`${resourceUrl}: Readability title: ${article.title}`);

  var responseJson = {
    status: "success",
    title: article.title,
    content: article.content
  }

  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(responseJson));
}

const serveReadability = (resourceUrl, response) => {
  logMessage(`${resourceUrl}: Request initiated`);

  rq({
    url: resourceUrl,
    headers: {
      "user-agent": userAgent
    },
    gzip: true
  }, (error, fetchResponse, body) => {
    if (error) {
      logMessage(`${resourceUrl}: error detail: ${error}`);
      respondError(response, "FETCH_FAILURE", `Error: ${error}`);
      return;
    }

    if (!fetchResponse) {
      logMessage(`${resourceUrl}: No response object`);
      respondError(response, "FETCH_FAILURE", "No response object");
      return;
    }

    if (fetchResponse.statusCode != 200) {
      logMessage(`${resourceUrl}: Response ${fetchResponse.statusCode}`);
      respondError(response, "FETCH_FAILURE", `Response ${fetchResponse.statusCode}`);
      return;
    }

    if (!body || body.length === 0) {
      logMessage(`${resourceUrl}: Empty body received`);
      respondError(response, "FETCH_FAILURE", "Empty response");
      return;
    }

    logMessage(`${resourceUrl}: ${body.length} bytes received`); 
    handleHtml(resourceUrl, body, response);
  });
}

const requestHandler = (request, response) => {
  logMessage(`Incoming request: ${request.url}`);

  var reqUrl = url.parse(request.url, true);
  if (!reqUrl.query.url) {
    response.statusCode = 400;
    response.end();
    return;
  }

  serveReadability(encodeURI(reqUrl.query.url), response); 
}

const okHandler = (request, response) => {
  response.end("ok");
}

const app = express()
app.get("/", requestHandler);
app.get("/ok", okHandler);

app.listen(port, () => {
  logMessage(`Server is listening on ${port}`);
});


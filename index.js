const express = require("express");
const request = require("request");
// const redis = require("redis");
const cheerio = require("cheerio");
const app = express();
const dotenv = require("dotenv");
dotenv.config()
const cacheTTL = 60 * 5; // (5 minutes)

// const redisClient = redis.createClient();
// redisClient.on("error", (err) => console.error("Redis Error:", err));
// redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
// redisClient.on("connect", () => console.log("✅ Redis Connected"));
// redisClient.connect(); 

// app.use("/", async (req, res) => {
//   const url = targetSite + req.url;
//   request(url, (error, response, body) => {
//     if (error) return res.status(500).send("Fetch Failed");
//     body = body.replaceAll(/<!--[\s\S]*?-->/g, '');
//     // console.log(body)
//     const $ = cheerio.load(body);
//     $("script, link, img, iframe, source").each((_, element) => {
//       const attr = element.tagName === "script" ? "src" :
//                    element.tagName === "link" ? "href" :
//                    element.tagName === "img" || element.tagName === "source" ? "src" : null;

//       if (attr && $(element).attr(attr)) {
//         let newUrl = $(element).attr(attr);
//         if (newUrl.startsWith("/") || !newUrl.startsWith("http")) {
//           $(element).attr(attr, targetSite + newUrl);
//         }
//       }
//     });
//     const css = `
//         .w-webflow-badge{
//         display: none !important;
//         }
//          #__framer-badge-container {
//          display: none !important;
//     }
// `;
// $('head').append(`<style>${css}</style>`);

//     const modifiedHTML = $.html();
 
//     return res.send(modifiedHTML);
//   });
 
// });

app.use("/", async (req, res) => {
  const url = process.env.WEB_URL + req.url;
  request(url, (error, response, body) => {
    if (error) return res.status(500).send("Failed");
    body = body.replace(/<!--[\s\S]*?-->/g, '');
    const $ = cheerio.load(body);
    $("script, link, img, iframe, source").each((_, element) => {
      const attr = element.tagName === "script" ? "src" :
                   element.tagName === "link" ? "href" :
                   element.tagName === "img" || element.tagName === "source" ? "src" : null;

      if (attr && $(element).attr(attr)) {
        let newUrl = $(element).attr(attr);
        if (newUrl.startsWith("/") || !newUrl.startsWith("http")) {
          $(element).attr(attr, targetSite + newUrl);
        }
      }
    });
    const css = `
    #__framer-badge-container {
        display: none !important;
    }
`;
$('head').append(`<style>${css}</style>`);
    const modifiedHTML = $.html();
 
    return res.send(modifiedHTML);
  });
 
});
app.listen(process.env.PORT, () => console.log("Proxy running on port 3000"));

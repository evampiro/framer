const express = require("express");
const request = require("request");
const redis = require("redis");
const formidable = require('express-formidable');
const cheerio = require("cheerio");
const app = express();
const dotenv = require("dotenv");
dotenv.config()
const cacheTTL = 60 * 5; // (5 minutes)
const router = express.Router();
const redisClient = redis.createClient();
redisClient.on("error", (err) => console.error("Redis Error:", err));
redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
redisClient.on("connect", () => console.log("✅ Redis Connected"));
redisClient.connect(); 

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
app.use(formidable());
router.get("/clear",async(req,res)=>{
  try{
const keys= await redisClient.keys(`${process.env.SITE}:*`)
    console.log(keys)

if ( keys && keys.length > 0) {
 const count=await redisClient.del(keys) 
      if(count){
        console.log(`Cleared ${count} cached keys`);
        return  res.send(`Cleared ${count} cached keys`);
      }
   
      return  res.send(`Cleared failed!`);
} else {
  return res.send("No cache to clear");
}
}
catch(e)
{
console.error("Redis KEYS error:", err);
return res.status(500).send("Failed to clear cache");
}
})


router.post("/form",async (req,res,next)=>{

  console.log(req.fields)
  return res.status(201).json({message:"Done"})
})

app.use(router)



app.use("/", async (req, res) => {
  
 
  try{
    const url = process.env.WEB_URL + req.url;
  const cacheKey = `${process.env.SITE}:${url}`;
   const data = await redisClient.get(cacheKey)
    
    if(data)
      {
        // console.log("from cache")
return res.send(data)
      }

      request(url, (error, response, body) => {
        if (error) return res.status(500).send("Failed");
        body = body.replace(/<!--[\s\S]*?-->/g, '');
        body = body.replace('<div id="__framer-badge-container"></div>', '');
        body = body.replace(/https:\/\/framerusercontent\.com\//g, 'https://cdn.sanimstha.com.np/');
        const $ = cheerio.load(body);
        $("script, link, img, iframe, source").each((_, element) => {
          const attr = element.tagName === "script" ? "src" :
                       element.tagName === "link" ? "href" :
                       element.tagName === "img" || element.tagName === "source" ? "src" : null;
    
          if (attr && $(element).attr(attr)) {[]
            let newUrl = $(element).attr(attr);
            if (newUrl.startsWith("/") || !newUrl.startsWith("http")) {
              $(element).attr(attr, targetSite + newUrl);
            }
          }
        });
    //     const css = `
    //     #__framer-badge-container {
    //         display: none !important;
    //     }
    // `;
//     const script = `<script>
//     function replaceImageLinks() {
//     document.querySelectorAll('img').forEach(img => {
//         if (img.src.includes('framerusercontent.com')) {
//             img.src = img.src.replace('framerusercontent.com', 'cdn.sanimstha.com.np');
//         }

//          if (img.srcset.includes('framerusercontent.com')) {
//             img.srcset = img.srcset.replace(/framerusercontent\.com/g, 'cdn.sanimstha.com.np');
//         }
//     });
// }
// window.addEventListener('load', replaceImageLinks);
// // setInterval(replaceImageLinks, 2000);
//      </script>`;
const formScript = `
<script>
function handleForm(){
const form = document.querySelector("form");
if(!form)
return
form.replaceWith(form.cloneNode(true));
const newForm = document.querySelector("form");
  const submitBtn = newForm.querySelector("[type='submit']");
  const originalBtnHTML = submitBtn.innerHTML;
  const thankyou = originalBtnHTML
  
  newForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    // Change button to loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = "...";
    
    try {
      const formData = new FormData(newForm);
      const response = await fetch("/form", {
        method: "POST",
        body: formData
      });
      
      // const result = await response.json();
      
      // console.log(originalBtnHTML)
      submitBtn.innerHTML = '<p class="framer-text">Thank You</p>';
     
      // Reset form after 2 seconds (optional)
      setTimeout(() => {
        newForm.reset();
        submitBtn.innerHTML = originalBtnHTML;
      
        submitBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error("Error:", error);
      submitBtn.innerHTML =  '<p class="framer-text">Error! Try Again</p>' 

      setTimeout(() => {
        submitBtn.innerHTML = originalBtnHTML;
        submitBtn.disabled = false;
      }, 2000);
    }
  });
}

  window.addEventListener('load', handleForm);
 
 function watchUrlPath(targetPath, callback, interval = 1000) {
  let hasMatched = false;

  const checkPath = () => {
    const currentPath = window.location.pathname;
    
    if (currentPath === targetPath && !hasMatched) {
      hasMatched = true;
      callback();
    }
  };
  checkPath();
  const intervalId = setInterval(checkPath, interval);
  return () => clearInterval(intervalId);
}

//  window.addEventListener('load',watchUrlPath('/contact',handleForm))
const stopWatching = watchUrlPath('/contact', () => {
  
  handleForm();

});
  </script>
  `
     
      // $('head').append(script)
      $('head').append(formScript)
        const modifiedHTML = $.html();
        redisClient.set(cacheKey, modifiedHTML);
        console.log("live data")
        return res.send(modifiedHTML);
      })
  }
  catch(e){
    return res.send(e)
  }

 
});



app.listen(process.env.PORT, () => console.log("Proxy running on port 3000"));



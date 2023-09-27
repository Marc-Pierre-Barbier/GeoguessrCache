
function redirect(requestDetails) {
	console.log(`Redirecting: ${requestDetails.url} to ${requestDetails.url.replace("https://streetviewpixels-pa.googleapis.com", "http://localhost:8080")}`);
	return {
		redirectUrl: requestDetails.url.replace("https://streetviewpixels-pa.googleapis.com", "http://localhost:8080"),
	};
}

browser.webRequest.onBeforeRequest.addListener(
	redirect,
	{ urls: ["https://streetviewpixels-pa.googleapis.com/*"] },
	["blocking"]
);

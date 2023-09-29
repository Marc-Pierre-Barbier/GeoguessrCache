const cache: Record<string, Promise<{ data: Blob, headers: Headers }>> = {}
import * as path from "path"
import * as fs from "fs"
import * as crypto from "crypto"
import { heapStats } from "bun:jsc"

const cache_dir = path.join(import.meta.dir, "cache")

function url_tofilename(url) {
	const hasher = crypto.createHash("sha256")
	return hasher.update(url).digest('hex')
}

Bun.serve({
	async fetch(req) {
		const url = req.url

		if(typeof cache[url] !== 'undefined') {
			console.log("From cache: " + url)
			const response = await cache[url]
			return new Response(response.data, { headers: response.headers})
		}

		cache[url] = new Promise(async (res, rej) => {
			console.log("caching: " + url)

			const disk_path = path.join(cache_dir, url_tofilename(url) + ".jpg")
			const disk_path_header = path.join(cache_dir, url_tofilename(url) + ".json")

			console.log(heapStats().heapSize / 1024 / 1024)

			if(heapStats().heapSize / 1024 / 1024 > 800) {
				const all_urls = Object.keys(cache)
				const urls_to_remove = all_urls.slice(0, all_urls.length / 2)
				console.log("Wiping " + urls_to_remove.length / all_urls.length)
				for(const url of urls_to_remove) {
					delete cache[url]
				}
			}

			//loading from disk
			if(fs.existsSync(disk_path)) {
				console.log("Loading from disk: " + url)
				const data = await fs.promises.readFile(disk_path)
				const headers = JSON.parse((await fs.promises.readFile(disk_path_header)).toString()) as Headers

				return res({
					data: new Blob([data]),
					headers
				})
			}

			const new_req = new Request({
				...req,
				url: req.url.replace("http://localhost:8080", "https://streetviewpixels-pa.googleapis.com"),
			})

			//refetching not present in disk
			const request_result = await fetch(new_req)
			const data = await request_result.blob()
			const headers = request_result.headers
			headers.set('Access-Control-Allow-Origin', '*');
			headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

			//saving to disk
			const data_buf = await data.arrayBuffer()
			await fs.promises.writeFile(disk_path, data_buf)
			await fs.promises.writeFile(disk_path_header, JSON.stringify(headers))

			res({
				data, headers
			})
		})

		const response = await cache[url]
		return new Response(response.data, { headers: response.headers})

	},
	port: 8080
});

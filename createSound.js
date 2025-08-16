import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { sleep } from "https://js.sabae.cc/sleep.js";

const env = await load();
const APIKEY = env.SFXENGINE_API_KEY;

export const fetchAPI = async (path, req) => {
  const baseurl = "https://api.sfxengine.com/v1/";
  const url = baseurl + path;
  const opt = {
    method: req ? "POST" : "GET",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
      "Authorization": APIKEY,
    },
    body: req ? JSON.stringify(req) : undefined,
  };
  const res = await (await fetch(url, opt)).json();
  return res;
};

export const createSound = async (body, sec) => {
  if (!body || !sec) throw new Error("needs body and sec");
  const req = {
    prompt: body,
    length: parseInt(sec), // parseFloat(sec),
  };
  return await fetchAPI("sound-effect", req);
};

export const getSound = async (id) => {
  if (!id) throw new Error("needs id");
  return await fetchAPI("sound-effect/" + id);
};

export const fetchSound = async (body, sec) => {
  const res = await createSound(body, sec);
  if (res.success == false) throw new Error(res.error.issues.map(i => i.message).join(", "));
  //console.log(res, res.success, typeof res.success);
  if (res.status != "processing") throw new Error(res.status);
  await sleep(5000);
  for (let i = 0; i < 100; i++) {
    const res2 = await getSound(res.id);
    //console.log(res2.status);
    if (res2.status == "generated") {
      const bin = new Uint8Array(await (await fetch(res2.url)).arrayBuffer());
      return bin;
    }
    await sleep(1000);
  }
  throw new Error("timeout " + res.id);
};

if (import.meta.main) {
  const sec = Deno.args[0];
  const body = Deno.args[1];
  if (!body || !sec) {
    console.log("createSound.js [sec] [body]");
    Deno.exit(1);
  }
  const res = await fetchSound(body, sec);
  await Deno.writeFile("sound.wav", res);
}

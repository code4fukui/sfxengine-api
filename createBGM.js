import { fetchAPI } from "./createSound.js";
import { sleep } from "https://js.sabae.cc/sleep.js";

export const createBGM = async (body) => {
  if (!body) throw new Error("needs body");
  const req = {
    prompt: body,
    type: "background-music",
  };
  return await fetchAPI("song", req);
};

export const getBGM = async (id) => {
  if (!id) throw new Error("needs id");
  return await fetchAPI("song/" + id);
};

export const fetchBGM = async (body) => {
  const res = await createBGM(body);
  if (res.success == false) throw new Error(res.error.issues.map(i => i.message).join(", "));
  if (res.status != "processing") throw new Error(res.status);
  await sleep(5000);
  for (let i = 0; i < 100; i++) {
    const res2 = await getBGM(res.id);
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
  const body = Deno.args[0];
  if (!body) {
    console.log("createBGM.js [body]");
    Deno.exit(1);
  }
  const res = await fetchBGM(body);
  await Deno.writeFile("bgm.wav", res);
}

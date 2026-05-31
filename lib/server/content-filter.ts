/* Copyright (c) 2026 eele14. All Rights Reserved. */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[4@]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[7+]/g, "t")
    .replace(/\s+/g, " ")
    .trim();
}

const LINK_SHORTENER_RE =
  /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|short\.io|tiny\.cc|is\.gd|buff\.ly|rb\.gy|cutt\.ly|shorturl\.at|snip\.ly|bl\.ink|clck\.ru|tiny\.one|v\.gd|shorte\.st|po\.st|adf\.ly|bc\.vc|x\.co|go2l\.ink|hyperurl\.co|urlzs\.com|gg\.gg|tr\.im|cli\.re|url4\.fun|shor\.by|smol\.ai|qr\.ae|2\.gp|0\.gp|4\.gp|lnk\.to|lnk\.bio|solo\.to)\b/i;

const NSFW_DOMAIN_RE =
  /\b(pornhub|fuq|xvideos|xhamster|xnxx|onlyfans|fansly|stripchat|chaturbate|cam4|livejasmin|brazzers|redtube|youporn|tube8|spankbang|youjizz|bangbros|naughtyamerica|realitykings|mofos|digitalplayground|nubiles|twistys|thehun|slutload|drtuber|empflix|gotporn|hellporno|hornbunny|hotmovs|keezmovies|nudevista|peekvids|txxx|vporn|xmovies|extremetube|eporner|beeg|tnaflix|mp4porn|sexvid|javhd|javbus|javlibrary|hentaihaven|nhentai|rule34|e621|gelbooru|danbooru)\b/i;

const SLUR_RE =
  /\b(nigger|nigga|faggot|kike|spic|chink|gook|wetback|beaner|towelhead|raghead|retard|zipperhead|jigaboo|coon|darkie|porch.?monkey|jungle.?bunny|tar.?baby|camel.?jockey|sand.?nigger|hymie|heeb|polack|squaw|injun|wop|dago|kraut|gringo|gypsy|gyp|redskin)\b/i;

const PROFANITY_RE =
  /\b(fuck|fucker|fuckwit|shit|shithead|dipshit|bullshit|cunt|twat|asshole|dickhead|motherfucker|cocksucker|bitch|bastard|whore|slut|wanker|prick|bollocks|douchebag|dumbass|jackass|blowjob|handjob|rimjob|jizz|cumshot|rimming|fisting|creampie)\b/i;

const EXPLICIT_RE =
  /\b(penis|vagina|anal.?sex|oral.?sex|sex.?tape|nude.?photo|naked.?pic|onlyfan|buy.?crypto|nft.?mint|click.?here.?to.?win|you.?have.?been.?selected)\b/i;

export type FilterCategory =
  | "link-shortener"
  | "nsfw"
  | "slur"
  | "profanity"
  | "explicit";

export interface FilterResult {
  ok: boolean;
  category?: FilterCategory;
}

export function filterContent(text: string): FilterResult {
  if (LINK_SHORTENER_RE.test(text))
    return { ok: false, category: "link-shortener" };
  if (NSFW_DOMAIN_RE.test(text)) return { ok: false, category: "nsfw" };

  const norm = normalize(text);
  if (SLUR_RE.test(norm)) return { ok: false, category: "slur" };
  if (PROFANITY_RE.test(norm)) return { ok: false, category: "profanity" };
  if (EXPLICIT_RE.test(norm)) return { ok: false, category: "explicit" };

  return { ok: true };
}

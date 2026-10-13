import assert from "node:assert/strict";
import { test } from "node:test";
import { directMediaUrl, guessKind, pickTemplate, swapMedia, type StorySpec, type TemplateAd } from "../lib/creative";

test("share links become direct download links", () => {
  assert.equal(directMediaUrl("https://drive.google.com/file/d/abc_123-X/view?usp=sharing"), "https://drive.google.com/uc?export=download&id=abc_123-X");
  assert.equal(directMediaUrl("https://drive.google.com/open?id=xyz"), "https://drive.google.com/uc?export=download&id=xyz");
  assert.equal(directMediaUrl("https://www.dropbox.com/s/k/ad.mp4?dl=0"), "https://www.dropbox.com/s/k/ad.mp4?dl=1");
  assert.equal(directMediaUrl("https://www.dropbox.com/s/k/ad.mp4"), "https://www.dropbox.com/s/k/ad.mp4?dl=1");
  assert.equal(directMediaUrl(" https://cdn.x.com/a.jpg "), "https://cdn.x.com/a.jpg");
  assert.equal(guessKind("https://cdn.x.com/a.MP4?token=1"), "video");
  assert.equal(guessKind("https://cdn.x.com/a.png"), "image");
});

const imageAd: StorySpec = {
  page_id: "p1",
  instagram_user_id: "ig1",
  link_data: { link: "https://aacio.com", message: "Get more leads", name: "Free demo", description: "desc", call_to_action: { type: "BOOK_NOW" }, image_hash: "old", picture: "x" },
};

test("swapMedia keeps the copy and link, swaps the media", () => {
  const img = swapMedia(imageAd, { kind: "image", imageHash: "new" });
  assert.deepEqual(img, {
    page_id: "p1",
    instagram_user_id: "ig1",
    link_data: { link: "https://aacio.com", message: "Get more leads", name: "Free demo", description: "desc", call_to_action: { type: "BOOK_NOW", value: { link: "https://aacio.com" } }, image_hash: "new" },
  });
  const vid = swapMedia(imageAd, { kind: "video", videoId: "v1", thumbnailUrl: "https://t" });
  assert.deepEqual(vid.video_data, { video_id: "v1", image_url: "https://t", message: "Get more leads", title: "Free demo", link_description: "desc", call_to_action: { type: "BOOK_NOW", value: { link: "https://aacio.com" } } });
  assert.equal(vid.link_data, undefined);

  const fromVideo = swapMedia({ page_id: "p", video_data: { video_id: "a", message: "m", call_to_action: { type: "LEARN_MORE", value: { link: "https://l" } } } }, { kind: "image", imageHash: "h" });
  assert.equal(fromVideo.link_data?.link, "https://l");
  assert.equal(fromVideo.link_data?.message, "m");
});

test("swapMedia refuses carousels and ads without a link", () => {
  assert.throws(() => swapMedia({ page_id: "p", link_data: { link: "https://l", child_attachments: [] } }, { kind: "image", imageHash: "h" }), /carousel/);
  assert.throws(() => swapMedia({ page_id: "p", video_data: { video_id: "a" } }, { kind: "image", imageHash: "h" }), /link/);
  assert.throws(() => swapMedia({ page_id: "p" }, { kind: "image", imageHash: "h" }), /format/);
});

test("pickTemplate prefers the cheapest result, then spend, skipping uncopyable ads", () => {
  const ad = (id: string, spec?: StorySpec, status = "ACTIVE"): TemplateAd => ({ id, name: id, adset_id: "s", effective_status: status, creative: spec && { object_story_spec: spec } });
  const ads = [ad("dyn"), ad("a", imageAd), ad("b", imageAd), ad("c", imageAd, "PAUSED")];
  assert.equal(pickTemplate(ads, { dyn: { spend: 900, cpl: 50 }, a: { spend: 500, cpl: 250 }, b: { spend: 500, cpl: 100 } })?.id, "b");
  assert.equal(pickTemplate(ads, { a: { spend: 100, cpl: null }, c: { spend: 300, cpl: null } })?.id, "c");
  assert.equal(pickTemplate(ads, {})?.id, "a");
  assert.equal(pickTemplate([ad("dyn")], {}), null);
});

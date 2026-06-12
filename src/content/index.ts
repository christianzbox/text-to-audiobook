import { browserApi } from "../shared/browser/browserApi";
import { extractGenericDom } from "../shared/extraction/genericDomExtractor";
import { extractHackerNews, isHackerNewsUrl } from "../shared/extraction/hackerNewsExtractor";
import { extractWithReadability } from "../shared/extraction/readabilityExtractor";
import { extractReddit, isRedditUrl } from "../shared/extraction/redditExtractor";
import type { ExtractionResult, RedditExtractionOptions } from "../shared/extraction/types";
import type { RuntimeMessage } from "../shared/messages/types";
import { extractSelectedText } from "./domSelection";
import { PickerOverlay } from "./pickerOverlay";

const picker = new PickerOverlay(document);

browserApi.runtime.onMessage((message: RuntimeMessage) => {
  switch (message.type) {
    case "GET_PAGE_INFO":
      return getPageInfo();
    case "START_PICKER":
      picker.start();
      return { ok: true };
    case "CANCEL_PICKER":
      picker.cancel();
      return { ok: true };
    case "EXTRACT_PAGE":
      return extractPage(message.redditOptions);
    case "EXTRACT_SELECTION":
      return extractSelectedText(document);
    default:
      return undefined;
  }
});

function getPageInfo() {
  const url = document.location.href;
  return {
    title: document.title || "Untitled page",
    url,
    isReddit: isRedditUrl(url),
    isHackerNews: isHackerNewsUrl(url)
  };
}

function extractPage(redditOptions?: Partial<RedditExtractionOptions>): ExtractionResult {
  const url = document.location.href;
  if (isRedditUrl(url)) {
    return extractReddit(document, redditOptions);
  }
  if (isHackerNewsUrl(url)) {
    return extractHackerNews(document);
  }

  return extractWithReadability(document) ?? extractGenericDom(document);
}

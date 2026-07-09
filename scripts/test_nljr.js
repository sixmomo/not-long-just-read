import assert from "node:assert";
import {
  stripHtml,
  parseRss,
  parseHtmlData,
  splitSentences,
  isLowValueSentence,
  dedupeSentences
} from "./refresh_nljr.js";

// Mock RSS data
const mockRssXml = `
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Mock Blog</title>
    <item>
      <title><![CDATA[Mock Article 1 & More]]></title>
      <link>https://example.com/article-1</link>
      <pubDate>Mon, 06 Jul 2026 12:00:00 GMT</pubDate>
      <description>This is a test description</description>
    </item>
    <item>
      <title>Mock Article 2</title>
      <link>https://example.com/article-2</link>
      <pubDate>Sun, 05 Jul 2026 08:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
`;

// Mock Atom data
const mockAtomXml = `
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Mock Feed</title>
  <entry>
    <title>Mock Article 3</title>
    <link href="https://example.com/article-3"/>
    <published>2026-07-06T10:00:00Z</published>
  </entry>
</feed>
`;

// Mock HTML data
const mockHtml = `
<!doctype html>
<html>
<head>
  <title>Mock Title Page</title>
  <meta name="description" content="This is the mock page description. &amp; Keep it simple." />
  <meta property="og:title" content="OG Title" />
</head>
<body>
  <h1>Mock Page</h1>
  <p>This is the first paragraph. It is long enough and contains useful information.</p>
  <p>Subscribe now to read more. Watch now!</p>
  <p>This is the second valid paragraph. It provides a real PM coaching signal for momo.</p>
  <p>12:35 Timestamp sentence that should be skipped.</p>
  <p>This is the third valid paragraph. It discusses AI Ops and workflows in detail.</p>
</body>
</html>
`;

function testHtmlStrip() {
  console.log("Testing stripHtml...");
  assert.strictEqual(stripHtml("Hello <b>World</b>!"), "Hello World!");
  assert.strictEqual(stripHtml("A &amp; B &lt; C &gt; D &quot; E &#39; F"), "A & B < C > D \" E ' F");
  assert.strictEqual(stripHtml("  multiple   spaces  \n  new line  "), "multiple spaces new line");
}

function testRssParsing() {
  console.log("Testing parseRss...");
  const rssItems = parseRss(mockRssXml);
  assert.strictEqual(rssItems.length, 2);
  assert.strictEqual(rssItems[0].title, "Mock Article 1 & More");
  assert.strictEqual(rssItems[0].url, "https://example.com/article-1");
  assert.strictEqual(rssItems[0].publishedAt, "2026-07-06");
  
  assert.strictEqual(rssItems[1].title, "Mock Article 2");
  assert.strictEqual(rssItems[1].url, "https://example.com/article-2");
  assert.strictEqual(rssItems[1].publishedAt, "2026-07-05");

  const atomItems = parseRss(mockAtomXml);
  assert.strictEqual(atomItems.length, 1);
  assert.strictEqual(atomItems[0].title, "Mock Article 3");
  assert.strictEqual(atomItems[0].url, "https://example.com/article-3");
  assert.strictEqual(atomItems[0].publishedAt, "2026-07-06");
}

function testHtmlParsing() {
  console.log("Testing parseHtmlData...");
  const data = parseHtmlData(mockHtml);
  assert.strictEqual(data.title, "Mock Title Page");
  assert.strictEqual(data.description, "This is the mock page description. & Keep it simple.");
  
  assert.strictEqual(data.paragraphs.length, 3);
  assert.strictEqual(data.paragraphs[0], "This is the first paragraph. It is long enough and contains useful information.");
  assert.strictEqual(data.paragraphs[1], "This is the second valid paragraph. It provides a real PM coaching signal for momo.");
  assert.strictEqual(data.paragraphs[2], "This is the third valid paragraph. It discusses AI Ops and workflows in detail.");
}

function testSentenceHelper() {
  console.log("Testing splitSentences, isLowValueSentence, and dedupeSentences...");
  const text = "First sentence. Second sentence! Third sentence? Fourth sentence.";
  const sentences = splitSentences(text);
  assert.deepStrictEqual(sentences, ["First sentence.", "Second sentence!", "Third sentence?", "Fourth sentence."]);

  assert.strictEqual(isLowValueSentence("subscribe now"), true);
  assert.strictEqual(isLowValueSentence("(1:30) timestamp clip"), true);
  assert.strictEqual(isLowValueSentence("http://example.com link"), true);
  assert.strictEqual(isLowValueSentence("This is a valid sentence."), false);

  const duplicateSentences = ["Valid sentence.", "VALID SENTENCE.", "Another valid sentence.", "Valid sentence!!"];
  const deduped = dedupeSentences(duplicateSentences);
  assert.deepStrictEqual(deduped, ["Valid sentence.", "Another valid sentence."]);
}

try {
  testHtmlStrip();
  testRssParsing();
  testHtmlParsing();
  testSentenceHelper();
  console.log("\nAll unit tests passed successfully!");
} catch (error) {
  console.error("Test suite failed:", error);
  process.exit(1);
}

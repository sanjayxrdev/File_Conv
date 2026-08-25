# What Are PDF Tags: A Beginner’s Guide to Accessible PDFs

URL: https://pdf.net/blog/what-are-pdf-tags
Published: 2025-09-24
Author: Marcus Cooper
Reading time: 9 min
Categories: PDF Features

> PDF tags are hidden markers that define document structure, making content accessible, navigable, and searchable across devices.

PDF tags are hidden markers that define the structure and meaning of the content within a document. They identify headings, paragraphs, lists, tables, and images, making PDFs accessible to screen readers and easier to navigate across different devices.

This guide will further explain what PDF tags are, how to create them, and what common mistakes to avoid. You will also learn the best tools and practices to ensure your PDFs are fully accessible and make your documents usable for everyone.

## Key Takeaways

- PDF tags **define document structure and meaning**, identifying elements like headings, paragraphs, tables, and images to make PDFs easier to navigate.
- They’re crucial for** accessibility compliance**, helping documents meet ADA, Section 508, and WCAG standards.
- Tagged PDFs **improve user experience and SEO**, ensuring logical navigation, accurate search results, and better readability across devices and search engines.
- You can check and create tags easily with tools like Adobe Acrobat Pro, PDF Accessibility Checker (PAC), or by exporting properly structured Word, Excel, and PowerPoint documents with accessibility options enabled.
- Common** tagging mistakes** include: skipping heading levels, omitting alternative text, misformatting tables, or tagging decorative elements unnecessarily.

## What Are PDF Tags, and Why Are They Important?

A PDF tag is a **structural marker** embedded in a PDF that defines what an element is and how it relates to other elements on a page. It is similar to an HTML tag and is crucial for **navigation, accessibility, and machine readability**.

Let's take a closer look at some of the key reasons why PDF tags matter:

### #1. Accessibility Compliance

[Assistive technologies](https://www.atia.org/home/at-resources/what-is-at/), such as screen readers, rely on the semantic structure that PDF tags provide to interpret content accurately. Without tags, a PDF is essentially a flat image, which makes it **inaccessible to individuals with disabilities**.

In the United States, accessibility standards are defined by laws such as the **Americans with Disabilities Act (ADA) **and** [Section 508 of the Rehabilitation Act](https://www.section508.gov/manage/laws-and-policies/section-508-law/)**, both of which require digital documents to be accessible. Internationally, the **Web Content Accessibility Guidelines (WCAG)** reinforce the same principles by requiring documents to have a logical structure.

This means that individuals and organizations distributing untagged PDFs may face legal challenges. For example, a PDF report that lacks tags would fail to meet these PDF accessibility requirements and could result in fines or lawsuits. Beyond legal risks, **untagged PDFs undermine inclusivity** and exclude people who depend on accessible documents.

### #2. Better User Experience

PDF tags help documents provide a better user experience by creating a logical structure that makes content easier to navigate. Headings, lists, and tables are **correctly** **identified**, which **allows users to move quickly through sections**. This structure also ensures that the reading order is clear and consistent, so users can follow the flow of information without confusion.

Tags also **make documents more adaptable** across different devices. On smaller screens, such as those of phones or tablets, tagged PDFs can reflow their content so that the content remains readable without requiring constant zooming or scrolling.

In addition, tagging **enhances a [PDF’s searchability](https://pdf.net/blog/how-to-make-pdfs-searchable)**, which makes it easier to locate specific information. Because headings, paragraphs, and other elements are clearly identified, search functions can **return more accurate results**.

For example, if someone is browsing your PDF catalogue, they can quickly search for a product and be taken directly to the relevant section instead of scrolling through dozens of pages.

### #3. Search and Discoverability Advantages

Providing a clear structure, PDF tags **make documents easier for [search engines](https://www.geeksforgeeks.org/computer-science-fundamentals/what-are-search-engines-and-how-do-they-work/) to understand.** Headings, paragraphs, lists, and alternative text for images are all identifiable, which **allows the content to be indexed **more accurately.

This improves how search engines interpret the document and leads to better visibility in search results. If you regularly [embed PDFs](https://pdf.net/blog/how-to-embed-a-pdf-in-a-website), such as reports, guides, or white papers, on your website, the search engine optimization (SEO) advantages of PDF tagging help ensure your content is discoverable and can reach a wider audience.

## Common Types of PDF Tags with Examples

There are different types of PDF tags; here are the** most common ones**:

| Type of PDF tag | Name | Purpose | Example |
| --- | --- | --- | --- |
| < Document > | Root tag | Serves as the parent element that contains all other tags in the PDF | The entire PDF structure is wrapped under the root <Document> tag |
| < Sect >, < Div >, < Art > | Container tag | Groups related content together for a logical structure | A section of a manual divided into <Sect> for chapters |
| < P >, < H1 > - < H6 > | Text tag | Identifies text content such as paragraphs and headings | A heading marked with <H1> or a paragraph marked with <P> |
| < Figure > | Figure tag | Marks images, graphics, or illustrations with optional alternative text | A chart image tagged as <Figure alt="Sales growth chart"> |
| < Formula > | Formula tag | Identifies mathematical equations or scientific notations | An equation like E = mc² tagged as <Formula> |
| < Table > | Table tag | Defines tabular data and its structure, including rows and cells | A data table with <Table>, <TR> (Row), and <TD> (Cell) tags |
| < Artifact > | Artifact tag | Marks decorative or repetitive elements that should be ignored by assistive technologies | Page numbers, background images, footnote separators |

## How to Check if a PDF Is Tagged

If you want to check if a PDF is tagged, you can **use Adobe Acrobat Pro or PDF Accessibility Checker (PAC)**. Let’s take a closer look at the specific steps for each.

### #1. Adobe Acrobat Pro

Acrobat Pro includes** advanced features **such as adding or editing tags for accessibility, performing full accessibility checks, and securing PDFs with passwords or permissions.

1. Go to **File** **Properties** (Ctrl+D in Windows, Command+D in Mac).
2. Find the “**Tagged PDF**” field in the bottom left corner of the **Document** **Properties** dialog.
3. See if it says **No** or **Yes** after “**Tagged PDF:”**.

If you want to check the tag tree, find the **View **drop-down menu and click **Show/Hide > Navigation Panes > Tags**. The tags will appear in descending order from top to bottom.

### #2. PDF Accessibility Checker (PAC)

PAC (PDF Accessibility Checker) is a** free tool **you can use to check for PDF/UA and WCAG conformity. Here’s how to use it to check if a PDF is tagged:

1. Get the latest PDF Accessibility Checker from the PAC website.
2. Open the application and upload your PDF file.
3. The tool will produce a report with a visual inspection and pass/fail results of accessible PDF standards.

## How to Create a Tagged PDF

The easiest way to create a tagged PDF is to start with well-structured source files in **Word**, **Excel**, or **PowerPoint** and then export them correctly.

Microsoft Office applications have **built-in accessibility features** that, when used properly, ensure your PDF is tagged at the point of export.

Below are the** best practices** for preparing your document before export:

- Apply built-in heading styles such as **Heading 1** or **Heading 2** instead of manually changing font size or bolding text to ensure the PDF has a clear hierarchy.
- Provide short, descriptive text for graphics, charts, or icons, so that screen readers can communicate their purpose.
- Check if headings make sense on their own and guide the reader through the content; avoid vague labels like **“Introduction” or “Section 1”** without context.
- Insert lists and tables with the Office tools, not by manually spacing or formatting, so they convert into properly tagged structures.
- Run the Accessibility Checker in Word, Excel, or PowerPoint by selecting** Review > Check Accessibility** and checking the **Inspection Results**.

This is what it looks like in Word:

![Tagged PDF in Word](https://cdn.sanity.io/images/i16te7yp/production/aa681308aafb49498ea167f35d23f30426d60d6f-1523x349.png?fit=max&auto=format)

In Excel, it appears this way:

![Tagged PDF in Excel](https://cdn.sanity.io/images/i16te7yp/production/28b89d0a8992ac9efa5533c3ca092022d9088ead-1435x351.png?fit=max&auto=format)

This is what it looks like in PowerPoint:

![Tagged PDF in PowerPoint](https://cdn.sanity.io/images/i16te7yp/production/9b1d13d306cc8315584f9aa36c4772e6f181f9fc-1482x341.png?fit=max&auto=format)

Once you are sure you have met all the necessary accessible PDF standards, follow these general steps to export the document and [make a PDF](https://pdf.net/blog/how-do-i-make-a-pdf-file):

1. Open your Word, Excel, or PowerPoint document.
2. Go to **File > Save As** or **File > Export**.
3. Choose the [**PDF format**](https://pdf.net/blog/what-does-pdf-format-mean).
4. Before saving, select **Options** and make sure **Document structure tags for accessibility** is selected.
5. Save the document.

If you need to refine or repair tags after export, you can use dedicated PDF tagging software, such as Adobe Acrobat Pro or PAC. These tools allow you to check and improve tagging to satisfy PDF accessibility standards.

## Common Mistakes With PDF Tags and How to Avoid Them

Here are the most common mistakes with PDF tags and how to avoid them:

- **Incorrect heading hierarchy. **When headings are skipped or applied out of order, screen readers and navigation tools cannot guide users properly through the content. To avoid this, you should always use built-in heading styles in Word, Excel, or PowerPoint, and check whether they follow a logical sequence.
- **Missing alternative text for images.** Graphics, charts, and icons without descriptive text leave users relying on screen readers unable to understand the visual content. To prevent this, you should add alternative text for every non-decorative image before [saving your document as a PDF](https://pdf.net/blog/how-to-save-as-a-pdf) and ensure that the description doesn’t rely on context from surrounding text.
- **Tables not tagged properly. **Many users create tables using spaces or tabs instead of the table tool, which prevents screen readers from interpreting rows and columns correctly. Always use the table functions in your document and check that the PDF tags reflect proper table structure after export.
- **Decorative elements tagged unnecessarily. **This can create clutter in the document structure. Elements like background images, borders, or purely visual icons should be marked as artifacts or left untagged so that they are ignored by assistive technologies. As such, your document structure stays clear, and users can focus on the content that matters.

## Further Polish Your PDFs with Pdf.net

![what are pdf tags](https://cdn.sanity.io/images/i16te7yp/production/70cc02aafc17731b28ed9d6acde8e3366a7931dd-1894x748.png?fit=max&auto=format)

You can easily take your documents to the next level with our handy, browser-based tool. Our best features include [page rearrangement](https://pdf.net/blog/how-to-rearrange-pdf-pages) for a logical flow, [font adjustments](https://pdf.net/blog/how-to-change-font-in-pdf) that improve readability, and automatic page numbering for easier navigation.

Using [pdf.net](https://app.pdf.net/sign-up) alongside proper tagging ensures that your documents are both polished and accessible, providing users with a professional and seamless experience.

> **Manage Your PDFs Online with Ease**
> 
> Organize, optimize, and finalize your documents so they’re ready for submission or sharing.
> 
> [Try it FREE now](https://app.pdf.net/sign-up)

## Final Thoughts

PDF tags are essential for creating accessible, navigable, and user-friendly documents. They provide a clear structure, improve screen reader PDF compatibility, and make content easier to search and understand.

Checking existing PDFs, properly tagging new documents, and following best practices will ensure that your files meet accessibility standards and serve all users effectively. Remember that using the right tools simplifies the process and helps avoid common mistakes.

## What Are PDF Tags FAQs

### #1. What is the difference between tagged and untagged PDFs?

The difference between tagged and untagged PDFs is that **the former includes a clear PDF structure tree with headings, lists, tables, and alt text**, making them compatible with screen reader PDF compatibility. The latter lack this structure, which makes navigation, searching, and accessibility for assistive technologies difficult.

### #2. Are all PDFs automatically tagged?

**Not all** PDFs are automatically tagged; only PDFs exported from certain applications with tagging enabled, or edited with tools to add PDF tags. Scanned documents or ones created from simple conversions are often untagged.

### #3. Can I add tags to an existing PDF?

**Yes, you can** add tags to an existing PDF using PDF tagging software like Adobe Acrobat Pro. This improves accessibility and ensures compatibility with screen readers without recreating the document.

### #4. Are tagged PDFs required by law?

**Tagged PDFs are required **by accessibility laws in many countries, such as the ADA in the U.S. Proper **PDF metadata and tags **help meet these standards and ensure documents are usable for all readers.

## Related Articles

[Accessible PDF: How to Create and Optimize PDFs for Everyone](https://pdf.net/blog/accessible-pdf)

[How to Make a PDF Mobile-Friendly: Full Guide + Best Practices](https://pdf.net/blog/how-to-make-pdf-mobile-friendly)

[What Is PDF/A? Definition, Uses, and How to Create These Files](https://pdf.net/blog/what-is-pdf-a)



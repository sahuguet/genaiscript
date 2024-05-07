script({
    title: "rag",
    tests: {
        files: "src/rag/*",
        keywords: ["lorem ipsum", "markdown", "microsoft"],
    }
})

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Summarize the files.`
def(
    "MARKDOWN",
    (
        await retrieval.vectorSearch(
            "markdown",
            env.files.filter((f) => f.filename.endsWith(".md"))
        )
    ).files
)
def(
    "PDF",
    (
        await retrieval.vectorSearch(
            "lorem ipsum",
            env.files.filter((f) => f.filename.endsWith(".pdf"))
        )
    ).files
)
def(
    "WORD",
    (
        await retrieval.vectorSearch(
            "lorem ipsum",
            env.files.filter((f) => f.filename.endsWith(".docx"))
        )
    ).files
)
def("ALL", (await retrieval.vectorSearch("lorem ipsum", env.files)).files)

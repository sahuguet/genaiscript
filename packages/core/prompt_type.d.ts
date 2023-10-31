/// <reference path="./src/prompt_template.d.ts"/>

// keep in sync with PromptContext!

/**
 * Setup prompt title and other parameters.
 * Exactly one call should be present on top of .gptool.js file.
 */
declare function gptool(options: PromptArgs): void

/**
 * Equivalent of gptool() for system prompts.
 */
declare function system(options: PromptArgs): void

/**
 * Append given string to the prompt. It automatically appends "\n".
 * Typically best to use `` $`...` ``-templates instead.
 */
declare function text(body: string): void

/**
 * Append given string to the prompt. It automatically appends "\n".
 * `` $`foo` `` is the same as `text("foo")`.
 */
declare function $(strings: TemplateStringsArray, ...args: any[]): string

/**
 * Appends given (often multi-line) string to the prompt, surrounded in fences.
 * Similar to `text(env.fence); text(body); text(env.fence)`
 *
 * @param body string to be fenced
 * @param language typescript, python, markdown, etc...
 */
declare function fence(body: StringLike, language?: "markdown" | string): void

/**
 * Defines `name` to be the (often multi-line) string `body`.
 * Similar to `text(name + ":"); fence(body, language)`
 *
 * @param name name of defined entity, eg. "NOTE" or "This is text before NOTE"
 * @param body string to be fenced/defined
 * @param language typescript, python, markdown, etc...
 */
declare function def(
    name: string,
    body: StringLike,
    language?: "markdown" | string
): void

/**
 * Inline supplied files in the prompt.
 * Similar to `for (const f in files) { def("File " + f.filename, f.contents) }`
 *
 * @param files files to define, eg. `env.links` or a subset thereof
 */
declare function defFiles(files: LinkedFile[]): void

/**
 * Variables coming from the fragment on which the prompt is operating.
 */
declare var env: ExpansionVariables

/**
 * Fetches a given URL and returns the response.
 * @param url
 */
declare function fetchText(
    url: string | LinkedFile
): Promise<{ ok: boolean; status: number; text?: string; file?: LinkedFile }>

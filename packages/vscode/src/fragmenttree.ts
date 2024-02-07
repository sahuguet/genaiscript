import * as vscode from "vscode"
import {
    AI_REQUEST_CHANGE,
    ExtensionState,
    FRAGMENTS_CHANGE,
    FragmentsEvent,
} from "./state"
import { Fragment, allChildren, concatArrays } from "genaiscript-core"

type FragmentTreeNode = Fragment & { reference?: string }

class FragmentsTreeDataProvider
    implements vscode.TreeDataProvider<FragmentTreeNode>
{
    constructor(readonly state: ExtensionState) {
        this.state.addEventListener(FRAGMENTS_CHANGE, (e: FragmentsEvent) => {
            const { fragments } = e
            this.refresh(fragments)
        })
        this.state.addEventListener(AI_REQUEST_CHANGE, () => {
            const fragment = this.state.aiRequest?.options?.fragment
            this.refresh(fragment)
        })
        vscode.window.onDidChangeVisibleTextEditors(() => {
            this.refresh()
        })
    }

    async getTreeItem(element: FragmentTreeNode): Promise<vscode.TreeItem> {
        const {
            fullId,
            id,
            title,
            children,
            file,
            parent,
            references,
            reference,
        } = element
        const ai = this.state.aiRequest
        const hasChildren =
            !reference &&
            (children.length > 0 || Object.keys(references ?? {}).length > 0)
        const { computing, options, progress } = ai || {}
        const { fragment } = options || {}
        const generating = computing && fragment === element
        const item = new vscode.TreeItem(
            // title,
            parent ? title : vscode.workspace.asRelativePath(file.filename),
            hasChildren
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.None
        )
        item.id = `genaiscript.frag.${file.filename}${fullId}${
            reference ? `<${reference}` : ""
        }`
        item.contextValue = `fragment ${hasChildren ? `node` : `leaf`} ${
            reference ? `ref` : ""
        }`
        item.description = `${id.slice(1)}${
            generating ? `, ${progress?.tokensSoFar || 0} tokens` : ""
        }`
        item.command = {
            command: "genaiscript.fragment.navigate",
            title: "Navigate to...",
            arguments: [element],
        }
        item.resourceUri = vscode.Uri.file(file.filename)
        if (generating) item.iconPath = new vscode.ThemeIcon(`loading~spin`)
        else if (reference) item.iconPath = new vscode.ThemeIcon(`references`)
        else item.iconPath = vscode.ThemeIcon.File
        return item
    }

    async getChildren(
        element?: FragmentTreeNode | undefined
    ): Promise<FragmentTreeNode[]> {
        if (!element) {
            const fragments = this.state.rootFragments
            const editors = vscode.window.visibleTextEditors
            if (!editors?.length) return []
            const efs = new Set<string>(
                editors.map((editor) =>
                    vscode.workspace.asRelativePath(editor.document.fileName)
                )
            )
            const res = fragments.filter(
                (f) =>
                    efs.has(vscode.workspace.asRelativePath(f.file.filename)) ||
                    f.references.some((ref) =>
                        efs.has(vscode.workspace.asRelativePath(ref.filename))
                    ) ||
                    allChildren(f).some(
                        (c) =>
                            efs.has(
                                vscode.workspace.asRelativePath(c.file.filename)
                            ) ||
                            c.references.some((ref) =>
                                efs.has(
                                    vscode.workspace.asRelativePath(
                                        ref.filename
                                    )
                                )
                            )
                    )
            )
            return res
        } else if (element.reference) {
            return []
        } else {
            const prj = element.file.project
            const otherFragments: FragmentTreeNode[] = concatArrays(
                ...element.references
                    .map((f) => prj.resolve(f.filename))
                    .filter(Boolean)
                    .map((e) => e.roots)
            ).map(
                (obj: Fragment) =>
                    <FragmentTreeNode>{ ...obj, reference: element.fullId }
            )
            const res = element.children.concat(otherFragments)
            return res
        }
    }

    // It's a little more complicated for references?
    getParent?(element: FragmentTreeNode): FragmentTreeNode {
        return element?.parent
    }

    async resolveTreeItem?(
        item: vscode.TreeItem,
        element: FragmentTreeNode,
        token: vscode.CancellationToken
    ) {
        let { text } = element
        if (text) {
            if (element.file.filesyntax !== "markdown")
                text =
                    "````" +
                    element.file.filesyntax +
                    "\n" +
                    text.replace(/\n+$/, "") +
                    "\n" +
                    "````"
            item.tooltip = new vscode.MarkdownString(text, true)
        }
        return item
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        void | FragmentTreeNode | FragmentTreeNode[]
    > = new vscode.EventEmitter<void | FragmentTreeNode | FragmentTreeNode[]>()
    readonly onDidChangeTreeData: vscode.Event<
        void | FragmentTreeNode | FragmentTreeNode[]
    > = this._onDidChangeTreeData.event

    refresh(treeItem?: FragmentTreeNode | FragmentTreeNode[]): void {
        this._onDidChangeTreeData.fire(treeItem)
    }
}

export function activateFragmentTreeDataProvider(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const treeDataProvider = new FragmentsTreeDataProvider(state)
    const treeView = vscode.window.createTreeView("genaiscript.fragments", {
        treeDataProvider,
    })
    subscriptions.push(treeView)
    const fragmentReveal = async (fragment: string | Fragment) => {
        fragment = state.project.resolveFragment(fragment)
        if (!fragment) return
        treeView.reveal(fragment)
    }
    subscriptions.push(
        vscode.commands.registerCommand(
            "genaiscript.fragment.reveal",
            fragmentReveal
        )
    )
}

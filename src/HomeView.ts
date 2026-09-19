import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { JoinQuizModal } from "./JoinQuizModal";
import { MultiNoteSelectModal } from "./MultiNoteSelectModal";
import { QuizView, VIEW_TYPE_QUIZ } from "./QuizView";
import type QuizdianPlugin from "./main";

export const VIEW_TYPE_HOME = "quizdian-home-view";

export class HomeView extends ItemView {
  plugin: QuizdianPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: QuizdianPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_HOME;
  }

  getDisplayText() {
    return "Quizdian";
  }

  getIcon() {
    return "help-circle";
  }

  async onOpen() {
    this.render();
  }

  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("quizdian-home");

    container.createEl("h2", { text: "Quizdian" });

    const selectBtn = container.createEl("button", {
      text: "Select notes",
      cls: "quizdian-home-btn",
    });
    selectBtn.onclick = () => {
      new MultiNoteSelectModal(this.app, this.plugin).open();
    };

    const joinBtn = container.createEl("button", {
      text: "Join quiz",
      cls: "quizdian-home-btn",
    });
    joinBtn.onclick = () => {
      new JoinQuizModal(this.app, this.plugin).open();
    };

    const history = this.plugin.data.history;

    if (history.length > 0) {
      container.createEl("p", { text: "History", cls: "quizdian-history-heading" });

      const list = container.createDiv({ cls: "quizdian-history-list" });

      history.slice(0, 10).forEach((entry) => {
        const row = list.createDiv({ cls: "quizdian-history-row" });

        row.createEl("p", { text: entry.title, cls: "quizdian-history-title" });

        const meta = row.createDiv({ cls: "quizdian-history-meta" });
        meta.createEl("span", { text: entry.code });
        meta.createEl("span", {
          text: new Date(entry.timestamp).toLocaleDateString(),
        });

        row.onclick = async () => {
          const { workspace } = this.app;
          let leaf = workspace.getLeavesOfType(VIEW_TYPE_QUIZ)[0];
          if (!leaf) {
            leaf = workspace.getLeaf("tab");
            await leaf.setViewState({ type: VIEW_TYPE_QUIZ, active: true });
          }
          workspace.revealLeaf(leaf);
          (leaf.view as QuizView).setQuestions(entry.questions, entry.code);
        };
      });
    }
  }

  async onClose() {}
}
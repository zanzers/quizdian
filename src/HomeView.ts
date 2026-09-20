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
    return "brain";
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

  const historyHeader = container.createDiv({ cls: "quizdian-history-header" });
  historyHeader.createEl("p", { text: "History", cls: "quizdian-history-heading" });

  if (history.length > 0) {
    const clearBtn = historyHeader.createEl("button", {
      text: "Clear",
      cls: "quizdian-clear-btn",
    });
    clearBtn.onclick = async () => {
      await this.plugin.clearHistory();
      this.render();
      new Notice("History cleared.");
    };
  }

  if (history.length === 0) {
    container.createEl("p", { text: "No quizzes yet.", cls: "quizdian-history-empty" });
    return;
  }

  const list = container.createDiv({ cls: "quizdian-history-list" });

  history.slice(0, 10).forEach((entry) => {
    const card = list.createDiv({ cls: "quizdian-history-card" });

    card.createEl("p", { text: entry.title, cls: "quizdian-history-title" });

    const codeRow = card.createDiv({ cls: "quizdian-history-field quizdian-history-code-row" });
    codeRow.createEl("span", { text: "Code: ", cls: "quizdian-history-key" });
    codeRow.createEl("span", { text: entry.code, cls: "quizdian-history-code-val" });

    const copyBtn = codeRow.createEl("button", { text: "Copy", cls: "quizdian-copy-btn" });
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(entry.code);
      new Notice("Code copied!");
    };

    const scoreRow = card.createDiv({ cls: "quizdian-history-field" });
    scoreRow.createEl("span", { text: "Score: ", cls: "quizdian-history-key" });
    scoreRow.createEl("span", {
      text: entry.score ? `${entry.score.correct} / ${entry.score.total}` : "Not taken yet",
      cls: entry.score ? "quizdian-history-score-val" : "",
    });

    const dateRow = card.createDiv({ cls: "quizdian-history-field" });
    dateRow.createEl("span", { text: "Date: ", cls: "quizdian-history-key" });
    dateRow.createEl("span", {
      text: new Date(entry.completedAt ?? entry.timestamp).toLocaleDateString(),
    });

    card.onclick = async () => {
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

  async onClose() {}
}
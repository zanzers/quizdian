import { App, Modal, Notice } from "obsidian";
import { QuizView, VIEW_TYPE_QUIZ } from "./QuizView";
import type QuizdianPlugin from "./main";

type Question = {
  type: "multiple_choice" | "fill_in_blank";
  question: string;
  options?: { A: string; B: string; C: string; D: string };
  correct: string;
};

export class SaveQuizModal extends Modal {
  plugin: QuizdianPlugin;
  questions: Question[];
  suggestedTitle: string;
  code = "";

  constructor(app: App, plugin: QuizdianPlugin, questions: Question[], suggestedTitle = "") {
    super(app);
    this.plugin = plugin;
    this.questions = questions;
    this.suggestedTitle = suggestedTitle;
  }

  async onOpen() {
    this.renderLoading();
    await this.saveQuiz();
  }

  renderLoading() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("p", { text: "Saving your quiz..." });
  }

  async saveQuiz() {
    const title = this.suggestedTitle || "Untitled Quiz";

    try {
      const res = await fetch(`${this.plugin.settings.backendUrl}/api/save-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic: title,
          questions: this.questions,
          sources: ["Obsidian"],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        new Notice(`Quizdian: ${data.error || "couldn't save quiz"}`);
        this.close();
        return;
      }

      this.code = data.code;

      await this.plugin.addHistoryEntry({
        code: this.code,
        title,
        count: this.questions.length,
        timestamp: Date.now(),
        type: "generated",
        questions: this.questions,
      });

      this.renderForm();
    } catch (err) {
      new Notice("Quizdian: couldn't reach the server.");
      this.close();
    }
  }

  renderForm() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("quizdian-save");

    contentEl.createEl("h3", { text: "Quiz ready" });

    contentEl.createEl("label", { text: "Title" });
    const titleInput = contentEl.createEl("input", {
      type: "text",
      placeholder: "e.g. Database Sharding Basics",
      cls: "quizdian-fill-input",
    });
    titleInput.value = this.suggestedTitle;

    titleInput.onblur = async () => {
      const newTitle = titleInput.value.trim();
      if (!newTitle || newTitle === this.suggestedTitle) return;

      await fetch(`${this.plugin.settings.backendUrl}/api/quiz/${this.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
    };

    contentEl.createEl("p", {
      text: `Number of questions: ${this.questions.length}`,
      cls: "quizdian-progress",
    });

    contentEl.createEl("label", { text: "Code" });
    const codeRow = contentEl.createDiv({ cls: "quizdian-code-row" });
    codeRow.createEl("code", { text: this.code, cls: "quizdian-code" });
    const copyBtn = codeRow.createEl("button", { text: "Copy", cls: "quizdian-copy-btn" });
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(this.code);
      new Notice("Code copied!");
    };

    const startBtn = contentEl.createEl("button", {
      text: "Start quiz now",
      cls: "quizdian-next-btn",
    });
    startBtn.onclick = async () => {
      this.close();
      const { workspace } = this.app;
      let leaf = workspace.getLeavesOfType(VIEW_TYPE_QUIZ)[0];
      if (!leaf) {
        leaf = workspace.getLeaf("tab");
        await leaf.setViewState({ type: VIEW_TYPE_QUIZ, active: true });
      }
      workspace.revealLeaf(leaf);
      (leaf.view as QuizView).setQuestions(this.questions, this.code);
    };
  }

  onClose() {
    this.contentEl.empty();
  }
}
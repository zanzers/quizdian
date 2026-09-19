import { App, Modal, Notice } from "obsidian";
import { QuizView, VIEW_TYPE_QUIZ } from "./QuizView";
import type QuizdianPlugin from "./main";

type Question = {
  type: "multiple_choice" | "fill_in_blank";
  question: string;
  options?: { A: string; B: string; C: string; D: string };
  correct: string;
};

type QuizData = {
  code: string;
  title: string;
  questions: Question[];
};

export class JoinQuizModal extends Modal {
  plugin: QuizdianPlugin;
  foundQuiz: QuizData | null = null;

  constructor(app: App, plugin: QuizdianPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    this.renderCodeEntry();
  }

  renderCodeEntry() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("quizdian-save");

    contentEl.createEl("h3", { text: "Join a quiz" });

    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "Enter code, e.g. k3f9-x8q-p4mz",
      cls: "quizdian-fill-input",
    });

    const findBtn = contentEl.createEl("button", {
      text: "Find quiz",
      cls: "quizdian-next-btn",
    });

    findBtn.onclick = async () => {
      const code = input.value.trim();
      if (!code) return;

      findBtn.setText("Looking up...");
      findBtn.disabled = true;

      try {
        const res = await fetch(`https://quizora-2ugj.vercel.app/api/quiz/${code}`);
        const data = await res.json();

        if (!res.ok) {
          new Notice(data.error || "Quiz not found.");
          findBtn.setText("Find quiz");
          findBtn.disabled = false;
          return;
        }

        this.foundQuiz = data;
        this.renderPreview();
      } catch (err) {
        new Notice("Quizdian: couldn't reach the server.");
        findBtn.setText("Find quiz");
        findBtn.disabled = false;
      }
    };
  }

  renderPreview() {
    if (!this.foundQuiz) return;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("quizdian-save");

    contentEl.createEl("h3", { text: "Join the Quiz" });

    contentEl.createEl("label", { text: "Title" });
    contentEl.createEl("p", { text: this.foundQuiz.title, cls: "quizdian-preview-value" });

    contentEl.createEl("label", { text: "Number of questions" });
    contentEl.createEl("p", {
      text: `${this.foundQuiz.questions.length}`,
      cls: "quizdian-preview-value",
    });

    contentEl.createEl("label", { text: "Code" });
    contentEl.createEl("p", { text: this.foundQuiz.code, cls: "quizdian-preview-value" });

    const joinBtn = contentEl.createEl("button", {
      text: "Join",
      cls: "quizdian-next-btn",
    });

    joinBtn.onclick = async () => {
      const quiz = this.foundQuiz!;

      await this.plugin.addHistoryEntry({
        code: quiz.code,
        title: quiz.title,
        count: quiz.questions.length,
        timestamp: Date.now(),
        type: "joined",
        questions: quiz.questions,
      });

      this.close();
      const { workspace } = this.app;
      let leaf = workspace.getLeavesOfType(VIEW_TYPE_QUIZ)[0];
      if (!leaf) {
        leaf = workspace.getLeaf("tab");
        await leaf.setViewState({ type: VIEW_TYPE_QUIZ, active: true });
      }
      workspace.revealLeaf(leaf);
      (leaf.view as QuizView).setQuestions(quiz.questions, quiz.code);
    };
  }

  onClose() {
    this.contentEl.empty();
  }
}
import { ItemView, WorkspaceLeaf, Notice } from "obsidian";

export const VIEW_TYPE_QUIZ = "quizdian-quiz-view";

type Question = {
  type: "multiple_choice" | "fill_in_blank";
  question: string;
  options?: { A: string; B: string; C: string; D: string };
  correct: string;
};

export class QuizView extends ItemView {
  questions: Question[] = [];
  code: string = "";
  current = 0;
  answers: string[] = [];

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_QUIZ;
  }

  getDisplayText() {
    return "Quizdian";
  }

  getIcon() {
    return "help-circle";
  }

  setQuestions(questions: Question[], code = "") {
    this.questions = questions;
    this.code = code;
    this.current = 0;
    this.answers = [];
    this.renderQuestion();
  }

  async onOpen() {
    this.renderQuestion();
  }

  renderQuestion() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("quizdian-container");

    if (this.questions.length === 0) {
      container.createEl("p", { text: "No quiz loaded yet." });
      return;
    }

    const q = this.questions[this.current];

    container.createEl("p", {
      text: `Question ${this.current + 1} of ${this.questions.length}`,
      cls: "quizdian-progress",
    });

    if (this.code) {
      const codeEl = container.createEl("p", {
        text: `Code: ${this.code}  (click to copy)`,
        cls: "quizdian-code-label",
      });
      codeEl.onclick = () => {
        navigator.clipboard.writeText(this.code);
        new Notice("Code copied!");
      };
    }

    container.createEl("h3", { text: q.question });

    let selected = this.answers[this.current] ?? "";

    const goNext = () => {
      if (!selected) {
        new Notice("Please answer before continuing.");
        return;
      }

      this.answers[this.current] = selected;

      if (this.current + 1 < this.questions.length) {
        this.current++;
        this.renderQuestion();
      } else {
        this.showScore();
      }
    };

    const goBack = () => {
      if (this.current === 0) return;
      this.answers[this.current] = selected;
      this.current--;
      this.renderQuestion();
    };

    if (q.type === "multiple_choice") {
      const optionsEl = container.createDiv({ cls: "quizdian-options" });

      Object.entries(q.options!).forEach(([key, value]) => {
        const btn = optionsEl.createEl("button", {
          text: `${key}. ${value}`,
          cls: "quizdian-option-btn",
        });
        if (selected === key) btn.addClass("selected");
        btn.onclick = () => {
          selected = key;
          optionsEl.querySelectorAll("button").forEach((b) => b.removeClass("selected"));
          btn.addClass("selected");
        };
      });
    } else {
      const input = container.createEl("input", {
        type: "text",
        placeholder: "Type your answer",
        cls: "quizdian-fill-input",
      });
      input.value = selected;
      input.oninput = () => {
        selected = input.value;
      };
      input.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            goNext();
          }
        },
        true
      );
    }

    const btnRow = container.createDiv({ cls: "quizdian-btn-row" });

    const backBtn = btnRow.createEl("button", {
      text: "Back",
      cls: "quizdian-back-btn",
    });
    backBtn.disabled = this.current === 0;
    backBtn.onclick = goBack;

    const nextBtn = btnRow.createEl("button", {
      text: this.current + 1 === this.questions.length ? "Finish" : "Next",
      cls: "quizdian-next-btn",
    });
    nextBtn.onclick = goNext;
  }

  showScore() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("quizdian-score");

    const correctCount = this.questions.filter(
      (q, i) => q.correct.trim().toLowerCase() === (this.answers[i] ?? "").trim().toLowerCase()
    ).length;

    const percent = Math.round((correctCount / this.questions.length) * 100);

    container.createEl("p", { text: "Quiz complete", cls: "quizdian-score-label" });
    container.createEl("h1", {
      text: `${correctCount} / ${this.questions.length}`,
      cls: "quizdian-score-total",
    });
    container.createEl("p", { text: `${percent}% correct`, cls: "quizdian-score-percent" });

    const missed = this.questions
      .map((q, i) => ({ q, i }))
      .filter(({ q, i }) => q.correct.trim().toLowerCase() !== (this.answers[i] ?? "").trim().toLowerCase());

    if (missed.length > 0) {
      container.createEl("p", { text: "Missed questions", cls: "quizdian-missed-heading" });

      const missedList = container.createDiv({ cls: "quizdian-missed-list" });
      missed.forEach(({ q }) => {
        const row = missedList.createDiv({ cls: "quizdian-missed-row" });
        row.createEl("p", { text: `✕ ${q.question}`, cls: "quizdian-missed-question" });
        row.createEl("p", { text: `Correct: ${q.correct}`, cls: "quizdian-missed-answer" });
      });
    }

    if (this.code) {
      container.createEl("p", { text: `Code: ${this.code}`, cls: "quizdian-code-label" });
    }
    const actionsRow = container.createDiv({ cls: "quizdian-score-actions" });

    const retakeBtn = actionsRow.createEl("button", {
    text: "Retake",
    cls: "quizdian-next-btn",
    });
    retakeBtn.onclick = () => {
    this.setQuestions(this.questions, this.code);
    };

    const homeBtn = actionsRow.createEl("button", {
    text: "Back to home",
    cls: "quizdian-back-btn",
    });
    homeBtn.onclick = () => {
    const { workspace } = this.app;
    const homeLeaves = workspace.getLeavesOfType("quizdian-home-view");
    if (homeLeaves.length > 0) {
        workspace.revealLeaf(homeLeaves[0]);
    } else {
        const leaf = workspace.getLeaf("tab");
        leaf.setViewState({ type: "quizdian-home-view", active: true });
        workspace.revealLeaf(leaf);
    }
    };
  }

  async onClose() {}
}
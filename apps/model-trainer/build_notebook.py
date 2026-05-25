import subprocess
import sys
import tempfile
from pathlib import Path

import nbformat as nbf


def _collect_sources(root: Path) -> list[tuple[str, str]]:
    files = [
        ("src/config.py", "src/config.py"),
        ("src/data/download.py", "src/data/download.py"),
        ("src/data/features.py", "src/data/features.py"),
        ("src/models/lstm.py", "src/models/lstm.py"),
        ("src/data/load.py", "src/data/load.py"),
        ("src/training/export.py", "src/training/export.py"),
        ("src/training/trainer.py", "src/training/trainer.py"),
        ("src/evaluate/metrics.py", "src/evaluate/metrics.py"),
        ("main.py", root / "main.py"),
    ]
    result = []
    for label, path in files:
        full = root / path if isinstance(path, Path) else root / path
        result.append((label, full.read_text(encoding="utf-8")))
    return result


def _strip_internal(source: str) -> str:
    lines = []
    for line in source.split("\n"):
        stripped = line.strip()
        if stripped.startswith("from src."):
            continue
        if stripped.startswith("import src"):
            continue
        lines.append(line)
    return "\n".join(lines)


def main():
    root = Path(__file__).parent
    sources = _collect_sources(root)

    merged = "\n\n\n".join(
        f"# === {label} ===\n{_strip_internal(code)}"
        for label, code in sources
    )

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(merged)
        tmp_path = tmp.name

    out = root / "colab_train.ipynb"

    result = subprocess.run(
        [sys.executable, "-m", "jupytext", "--to", "notebook", tmp_path, "-o", str(out)],
        capture_output=True,
        text=True,
    )
    Path(tmp_path).unlink()

    if result.returncode != 0:
        print("jupytext failed:", result.stderr)
        sys.exit(1)

    nb = nbf.read(out, as_version=4)
    code = nbf.v4.new_code_cell
    md = nbf.v4.new_markdown_cell

    setup = [
        md("# Model Trainer - Colab GPU"),
        code("!pip install kagglehub matplotlib onnx onnxruntime pandas scikit-learn seaborn tensorflow tf2onnx -q"),
        code("import tensorflow as tf\nprint(\"GPU:\", tf.config.list_physical_devices(\"GPU\"))"),
        md("## Run training"),
    ]

    teardown = [
        md("## Save models to Drive"),
        code(
            "from google.colab import drive\n"
            'drive.mount("/content/drive")\n'
            "import os, shutil, glob\n"
            'out = "/content/drive/MyDrive/colab/model-trainer/models"\n'
            "if os.path.exists(out):\n"
            "    shutil.rmtree(out)\n"
            "for src in glob.glob(\"models/wesad_lstm/**\", recursive=True):\n"
            "    if os.path.isfile(src):\n"
            '        dst = src.replace("models/wesad_lstm", out)\n'
            "        os.makedirs(os.path.dirname(dst), exist_ok=True)\n"
            "        shutil.copy2(src, dst)\n"
            'print(f"Saved to {out}")\n'
        ),
    ]
    nb.cells = setup + list(nb.cells) + teardown
    nb.metadata["accelerator"] = "GPU"
    nb.metadata["colab"] = {"provenance": []}
    nbf.write(nb, out)
    print(f"Done -> {out}")


if __name__ == "__main__":
    main()

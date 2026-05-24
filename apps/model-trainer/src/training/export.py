from pathlib import Path

import tensorflow as tf
from tensorflow.keras import Model


def export_to_onnx(model: Model, seq_len: int, n_features: int, model_dir: Path):
    import tf2onnx

    onnx_path = model_dir / "model.onnx"
    input_name = "input"

    if hasattr(model, "input_names") and model.input_names:
        input_name = model.input_names[0]

    spec = (
        tf.TensorSpec((None, seq_len, n_features), tf.float32, name=input_name),
    )

    try:
        model_proto, _ = tf2onnx.convert.from_keras(
            model,
            input_signature=spec,
            opset=13,
            output_path=str(onnx_path),
        )
        print(f"Successfully converted to ONNX: {onnx_path}")
    except Exception as e:
        print(
            f"Direct ONNX conversion failed: {e}. Trying via temporary SavedModel..."
        )
        import subprocess
        import sys
        import tempfile

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_saved_model = str(Path(temp_dir) / "temp_save")
            tf.saved_model.save(model, temp_saved_model)

            cmd = [
                sys.executable,
                "-m",
                "tf2onnx.convert",
                "--saved-model",
                temp_saved_model,
                "--output",
                str(onnx_path),
                "--opset",
                "13",
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(
                    f"Successfully converted to ONNX via temporary SavedModel: {onnx_path}"
                )
            else:
                print(f"ONNX conversion CLI fallback failed: {result.stderr}")

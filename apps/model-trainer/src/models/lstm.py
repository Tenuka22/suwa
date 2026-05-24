import tensorflow as tf
from tensorflow.keras import Model, layers, regularizers

from src.config import MODEL


def build_rri_lstm(seq_len: int, n_features: int) -> Model:
    inputs = layers.Input(shape=(seq_len, n_features), name="input")

    x = layers.Bidirectional(
        layers.LSTM(
            MODEL.lstm_units,
            return_sequences=True,
            dropout=MODEL.lstm_dropout,
            recurrent_dropout=MODEL.lstm_recurrent_dropout,
            kernel_regularizer=regularizers.l2(MODEL.l2_reg),
        )
    )(inputs)
    x = layers.Bidirectional(
        layers.LSTM(
            MODEL.lstm_units // 2,
            return_sequences=True,
            dropout=MODEL.lstm_dropout,
            recurrent_dropout=MODEL.lstm_recurrent_dropout,
            kernel_regularizer=regularizers.l2(MODEL.l2_reg),
        )
    )(x)

    x = layers.GlobalAveragePooling1D()(x)

    x = layers.BatchNormalization()(x)
    x = layers.Dropout(MODEL.dropout_rate + 0.1)(x)
    x = layers.Dense(
        16, activation="relu", kernel_regularizer=regularizers.l2(MODEL.l2_reg)
    )(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(MODEL.dropout_rate + 0.1)(x)

    outputs = layers.Dense(1, activation="sigmoid", name="stress_prob")(x)

    model = Model(inputs=inputs, outputs=outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=MODEL.learning_rate),
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.AUC(name="auc"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.Precision(name="precision"),
        ],
    )
    return model

from os import path

import kagglehub


def dataset_fetching():
    initial_path = kagglehub.dataset_download("qiriro/stress")
    return path.join(initial_path, "dataset")

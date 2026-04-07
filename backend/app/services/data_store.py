import json
import os
from typing import Any, Optional

from app.config import settings


class DataStore:
    """Simple JSON file CRUD utility."""

    def __init__(self):
        self.data_dir = settings.data_dir

    def _path(self, filename: str) -> str:
        return os.path.join(self.data_dir, filename)

    def read(self, filename: str) -> list[dict]:
        path = self._path(filename)
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def write(self, filename: str, data: list[dict]) -> None:
        path = self._path(filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def append(self, filename: str, item: dict) -> None:
        data = self.read(filename)
        data.append(item)
        self.write(filename, data)

    def find_by_id(self, filename: str, id: str) -> Optional[dict]:
        data = self.read(filename)
        for item in data:
            if item.get("id") == id:
                return item
        return None

    def update_by_id(self, filename: str, id: str, updates: dict) -> Optional[dict]:
        data = self.read(filename)
        for item in data:
            if item.get("id") == id:
                item.update(updates)
                self.write(filename, data)
                return item
        return None

    def filter(self, filename: str, **kwargs: Any) -> list[dict]:
        data = self.read(filename)
        results = []
        for item in data:
            match = True
            for key, value in kwargs.items():
                if isinstance(value, list):
                    if item.get(key) not in value:
                        match = False
                        break
                elif item.get(key) != value:
                    match = False
                    break
            if match:
                results.append(item)
        return results


data_store = DataStore()

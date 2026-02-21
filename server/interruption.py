class InterruptionManager:
    def __init__(self):
        self._speaking = False

    def start(self):
        self._speaking = True

    def stop(self):
        self._speaking = False

    def is_speaking(self):
        return self._speaking
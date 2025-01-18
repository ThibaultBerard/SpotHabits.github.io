import sys
from PyQt5.QtWidgets import QApplication

from Controller import Controller
from View import View

if __name__ == '__main__':
    app = QApplication(sys.argv)
    controller = Controller()
    window = View(app, controller)
    controller.set_view(window)
    window.show()
    sys.exit(app.exec())

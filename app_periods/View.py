from PyQt5.QtCore import QDate, QSize, Qt
from PyQt5.QtGui import QColor

from PyQt5.QtWidgets import QMainWindow, QPushButton, QDateEdit, QLabel, QListWidget, QLineEdit, QHBoxLayout


def set_geometry(element, x, y, width, height):
    element.setGeometry(int(x), int(y), int(width), int(height))


class View(QMainWindow):
    def __init__(self, app, controller):
        super().__init__()

        self.controller = controller
        self.setWindowTitle("Ma première fenêtre Qt")
        # get screen size
        size = app.primaryScreen().size()
        self.width = size.width()
        self.height = size.height()

        set_geometry(self,
                     self.width*0.2, self.height*0.2,
                     self.width*0.6, self.height*0.6)


        self.current_year = 2024
        self.year_label = QLabel(str(self.current_year), self)
        set_geometry(self.year_label,
                        self.width*0.6*0.15, 10,
                        self.width*0.6*0.05, 20)
        self.year_label.setStyleSheet("border: 1px solid black; background-color: #ffffff; border-radius: 5px")
        self.year_label.setAlignment(Qt.AlignCenter)

        self.decrease_year_button = QPushButton("<", self)
        set_geometry(self.decrease_year_button,
                        self.width*0.6*0.1, 10,
                        self.width*0.6*0.05, 20)
        self.decrease_year_button.clicked.connect(self.decrease_year)
        self.increment_year_button = QPushButton(">", self)
        set_geometry(self.increment_year_button,
                        self.width*0.6*0.2, 10,
                        self.width*0.6*0.05, 20)
        self.increment_year_button.clicked.connect(self.add_year)

        self.date_selector = []

        self.create_date_selector()
        set_geometry(self.date_selector[-1],
                     self.width*0.6*0.05, 50,
                     self.width*0.6*0.1, 50)

        self.switch_date_button = QPushButton("<->", self)
        set_geometry(self.switch_date_button,
                     self.width*0.6*0.15, 50,
                     self.width*0.6*0.05, 50)
        self.switch_date_button.clicked.connect(self.switch_date)

        self.create_date_selector()
        set_geometry(self.date_selector[-1],
                     self.width*0.6*0.2, 50,
                     self.width*0.6*0.1, 50)

        self.add_period_button = QPushButton("Ajouter une période", self)
        set_geometry(self.add_period_button,
                     self.width*0.6*0.35, 50,
                     self.width*0.6*0.1, 50)
        self.add_period_button.clicked.connect(self.add_period)
        self.add_period_button.setStyleSheet("background-color: #82e0aa")

        self.button = QPushButton("Ajouter la catégorie", self)
        set_geometry(self.button,
                     self.width*0.6*0.88, self.height*0.6*0.0875,
                     self.width*0.6*0.103, self.height*0.6*0.05)
        self.button.clicked.connect(self.add_category)
        self.button.setStyleSheet("background-color: #82e0aa")

        self.line_edit = QLineEdit(self)
        set_geometry(self.line_edit,
                     self.width*0.6*0.7, self.height*0.6*0.0875,
                     self.width*0.6*0.16, self.height*0.6*0.05)
        self.line_edit.setPlaceholderText("Nom de la catégorie")

        self.list_widget = QListWidget(self)
        self.list_widget.setSelectionMode(QListWidget.SingleSelection)
        set_geometry(self.list_widget,
                     self.width*0.6*0.7, self.height*0.6*0.2,
                     self.width*0.6*0.2, self.height*0.6*0.6)
        self.list_widget.itemClicked.connect(self.on_item_selected)

        self.button_remove = QPushButton("Supprimer la catégorie", self)
        set_geometry(self.button_remove,
                     self.width*0.6*0.7, self.height*0.6*0.82,
                     self.width*0.6*0.2, self.height*0.6*0.05)
        self.button_remove.clicked.connect(self.remove_category)
        self.button_remove.setStyleSheet("background-color: #c0392b")

        self.color_list_layout = QHBoxLayout(self)
        self.color_list_layout.setSpacing(10)
        color_list = controller.get_possible_colors()
        self.selected_color = color_list[0]
        self.current_color = color_list[0]
        color_buttons = []
        for i in range(len(color_list)):
            color_buttons.append(QPushButton("", self))
            color_buttons[-1].setFixedSize(QSize(25, 25))
            set_geometry(color_buttons[-1],
                         self.width*0.6*0.7 + i*30, 20,
                         25, 25)
            # changer la couleur du bouton selon la couleur associée
            color_buttons[-1].setStyleSheet("""
                QPushButton {
                    background-color: """ + color_list[i] + """;
                    border: 2px solid transparent;
                    border-radius: 5px;
                }
            """)
            color_buttons[-1].clicked.connect(lambda checked, button=color_buttons[-1]: self.change_color(button))
            self.color_list_layout.addWidget(color_buttons[-1])

        color_buttons[0].setFocus()
        # on clique artificiellement sur le premier bouton pour le sélectionner
        color_buttons[0].click()

        # on ajoute un texte à droite de la liste :
        self.label = QLabel("Aucune", self)
        set_geometry(self.label,
                     self.width*0.6*0.91, self.height*0.6*0.4,
                     self.width*0.6*0.08, self.height*0.6*0.1)
        self.label.setStyleSheet("border: 1px solid black; border-radius: 5px; background-color: #ffffff")
        self.label.setAlignment(Qt.AlignCenter)

        # Adding all possible categories in the displayed list
        self.update_category_list()

        # Ajout d'une zone rectangulaire pour contenir le calendrier (tableau 12*31)
        self.calendar = QLabel(self)
        set_geometry(self.calendar,
                     self.width*0.6*0.05, self.height*0.6*0.2,
                     self.width*0.6*0.6, self.height*0.6*0.6)
        self.calendar.setStyleSheet("background-color: gray")

        self.dates = {}
        self.init_calendar()

    def create_date_selector(self):
        current_id = len(self.date_selector)
        self.date_selector.append(QDateEdit(self))
        self.date_selector[-1].setCalendarPopup(True)
        self.date_selector[-1].setDate(QDate.currentDate())
        self.date_selector[-1].dateChanged.connect(lambda: self.on_date_changed(current_id))

    def update_calendar(self, year=2024):
        for month in range(0, 12):
            for day in range(0, 31):
                _, color = self.controller.get_period(QDate(year, month+1, day+1))
                self.dates[(day+1, month+1)].setStyleSheet("border: 1px solid black; background-color: " + color)

    def init_calendar(self):
        spacing_horizontal = 0
        spacing_vertical = 0

        # Dimensions des cases en tenant compte de l'espacement
        case_width = (self.width * 0.6 * 0.6 - (31 - 1) * spacing_horizontal) / 31
        case_height = (self.height * 0.6 * 0.6 - (12 - 1) * spacing_vertical) / 12

        print("Updating calendar")

        for month in range(0, 12):
            for day in range(0, 31):
                self.dates[(day+1, month+1)] = QPushButton(self.calendar)
                x_position = day * (case_width + spacing_horizontal)
                y_position = month * (case_height + spacing_vertical)
                set_geometry(self.dates[(day+1, month+1)], x_position, y_position, case_width, case_height)
                _, color = self.controller.get_period(QDate(2024, month+1, day+1))
                self.dates[(day+1, month+1)].setStyleSheet("border: 1px solid black; background-color: " + color)
                self.dates[(day+1, month+1)].clicked.connect(lambda checked, day=day+1, month=month+1: self.on_case_clicked(day, month))
                self.dates[(day+1, month+1)].setText(str(day+1))

        self.save_button = QPushButton("Sauvegarder", self)
        set_geometry(self.save_button,
                        self.width*0.6*0.2, self.height*0.6*0.85,
                        self.width*0.6*0.1, self.height*0.6*0.05)
        self.save_button.clicked.connect(self.on_save_button_clicked)
        self.load_button = QPushButton("Charger", self)
        set_geometry(self.load_button,
                     self.width*0.6*0.2, self.height*0.6*0.9,
                     self.width*0.6*0.1, self.height*0.6*0.05)
        self.file_name = QLineEdit(self)
        self.load_button.clicked.connect(self.on_load_button_clicked)
        set_geometry(self.file_name,
                        self.width*0.6*0.31, self.height*0.6*0.875,
                        self.width*0.6*0.2, self.height*0.6*0.05)

    def on_date_changed(self, i):
        # print("Date changée !")
        #print("Date sélectionnée : " + self.date_selector[i].date().toString("dd/MM/yyyy"))
        pass

    def on_item_selected(self, item):
        if item is not None:
            # print("Item sélectionné : " + item.text())
            color = item.background().color().name()
            self.label.setStyleSheet("border: 1px solid black; border-radius: 5px; background-color: " + color)
            self.label.setText(item.text())
            self.current_color = color

    def add_category(self):
        if self.line_edit.text() != "":
            self.controller.add_category(self.line_edit.text(), self.selected_color)
            self.update_category_list()

    def update_category_list(self):
        self.list_widget.clear()
        items = self.controller.get_possible_categories()
        print(items)
        for item, color in items:
            self.list_widget.addItem(item)
            list_item = self.list_widget.item(self.list_widget.count() - 1)
            list_item.setBackground(QColor(color))

    def remove_category(self):
        item = (self.list_widget.currentItem().text(),
                self.list_widget.currentItem().background().color().name())
        print("Suppression de la catégorie : " + str(item))
        self.controller.remove_category(item)
        self.update_category_list()

        if self.list_widget.currentItem() is None:
            self.label.setStyleSheet("border: 1px solid black; border-radius: 5px; background-color: #ffffff")
            self.label.setText("Aucune")

    def change_color(self, button):
        self.selected_color = button.styleSheet().split(":")[1].split(";")[0].strip()
        self.line_edit.setStyleSheet("background-color: " + self.selected_color)

    def on_case_clicked(self, day, month):
        print("Case clicked : " + str(day) + "/" + str(month))
        self.controller.add_period(QDate(self.current_year, month, day), (self.label.text(), self.current_color))
        self.update_calendar()

    def add_period(self):
        date = self.date_selector[0].date()
        while date <= self.date_selector[1].date():
            text = self.label.text()
            color = self.current_color
            self.controller.add_period(date, (text, color))
            date = date.addDays(1)
        self.update_calendar()

    def switch_date(self):
        temp = self.date_selector[0].date()
        self.date_selector[0].setDate(self.date_selector[1].date())
        self.date_selector[1].setDate(temp)

    def add_year(self):
        self.current_year += 1
        self.year_label.setText(str(self.current_year))
        self.update_calendar(self.current_year)

    def decrease_year(self):
        self.current_year -= 1
        self.year_label.setText(str(self.current_year))
        self.update_calendar(self.current_year)

    def on_save_button_clicked(self):
        file_name = self.file_name.text()
        if file_name != "":
            self.controller.save(file_name)

    def on_load_button_clicked(self):
        file_name = self.file_name.text()
        if file_name != "":
            self.controller.load(file_name)
        self.update_calendar(self.current_year)

from PyQt5.QtCore import QDate
import json

from tornado.escape import to_unicode


class Model:
    def __init__(self):
        self.possible_categories = []
        self.possible_colors = ["#ffffff", "#f1c40f", "#e74c3c", "#3498db",
                                "#2ecc71", "#9b59b6", "#34495e", "#f39c12",
                                "#e67e22", "#16a085", "#27ae60"]
        self.initial_categories = ["Aucune", "Vacances", "Travail", "Examen(s)", "Repos"]
        for i, x in enumerate(self.initial_categories):
            self.add_category(x, self.possible_colors[i])
        self.selected_category = None
        self.date_to_category = {}

        self.initial_date = QDate(2010, 1, 1)
        self.final_date = QDate(2030, 1, 1)
        self.init_dates()

    def init_dates(self):
        self.date_to_category = {}
        date = self.initial_date
        while date < self.final_date:
            self.add_period(date, ("Aucune", "#ffffff"))
            date = date.addDays(1)

    def get_possible_colors(self):
        return self.possible_colors

    def add_category(self, category, color):
        self.possible_categories.append((category, color))

    def remove_category(self, category):
        print(category)
        if category[0] == "Aucune":
            return
        self.possible_categories.remove(category)

    def add_period(self, date, category):
        # print("Ajout d'une période le " + str(date))

        if date == QDate(2025, 2, 31):
            return

        # print(date, end=":")
        # if date in self.date_to_category:
        # print(self.date_to_category[date], " => ", category)
        self.date_to_category[date] = category
        # print()

    def get_period(self, date):
        if date in self.date_to_category:
            return self.date_to_category[date]
        else:
            return "Aucune", "gray"

    def get_possible_categories(self):
        return self.possible_categories

    def save_to_file(self, file_name):
        # create periods
        periods = {}
        for category, _ in self.get_possible_categories()[1:]:
            periods[category] = []
        # print(periods.keys())
        print("SAVING TO " + file_name)

        date = self.initial_date
        current_category = None
        current_dates = []
        while date < self.final_date:
            category, _ = self.date_to_category[date]
            # print(date, category)
            # print(current_category)
            # print(current_dates)
            if category != "Aucune" and current_category is None:
                current_category = category
            elif current_category is not None and category != current_category:
                periods[current_category].append({"debut": current_dates[0].toString("yyyy-MM-dd"),
                                                  "fin": current_dates[-1].toString("yyyy-MM-dd")})
                current_dates = []
                if category == "Aucune":
                    current_category = None
                else:
                    current_category = category

            if category == current_category:
                current_dates.append(date)

            date = date.addDays(1)

        if current_dates:
            periods[current_category].append({"debut": current_dates[0].toString("yyyy-MM-dd"),
                                              "fin": current_dates[-1].toString("yyyy-MM-dd")})

        print("PERIODS :")
        print(periods)

        # Saving as a json:
        if file_name[-5:] != ".json":
            file_name += ".json"
        with open(file_name, "w") as file:
            str_ = json.dumps(periods,
                              indent=4, sort_keys=True,
                              separators=(',', ': '), ensure_ascii=False)
            file.write(to_unicode(str_))

    def load_from_file(self, file_name):
        if file_name[-5:] != ".json":
            file_name += ".json"

        # On vérifie que le fichier existe :
        try:
            with open(file_name, "r") as file:
                pass
        except FileNotFoundError:
            print("FILE NOT FOUND")
            return

        # On supprime toutes les périodes actuelles
        self.init_dates()

        print("LOADING FROM " + file_name)

        with open(file_name, "r") as file:
            periods = json.load(file)
            print("PERIODS :")
            print(periods)

        for category, dates in periods.items():
            for date in dates:
                debut = QDate.fromString(date["debut"], "yyyy-MM-dd")
                fin = QDate.fromString(date["fin"], "yyyy-MM-dd")
                while debut <= fin:
                    # on trouve l'id de la catégorie :
                    i = 0
                    for i, x in enumerate(self.possible_categories):
                        if x[0] == category:
                            break
                    self.add_period(debut, (category, self.possible_colors[i]))
                    debut = debut.addDays(1)

        print("LOADING DONE")

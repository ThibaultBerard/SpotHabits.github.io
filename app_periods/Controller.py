from Model import Model


class Controller:
    def __init__(self):
        self.model = Model()
        self.view = None

    def set_view(self, view):
        self.view = view

    def get_possible_colors(self):
        return self.model.get_possible_colors()

    def add_category(self, category, color):
        self.model.add_category(category, color)

    def remove_category(self, category):
        self.model.remove_category(category)

    def add_period(self, date, category):
        self.model.add_period(date, category)

    def get_possible_categories(self):
        return self.model.get_possible_categories()

    def get_period(self, date):
        return self.model.get_period(date)

    def save(self, file_name):
        self.model.save_to_file(file_name)

    def load(self, file_name):
        self.model.load_from_file(file_name)


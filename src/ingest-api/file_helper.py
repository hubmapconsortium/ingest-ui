import os
import pathlib
import pprint


class FileHelper:
    @staticmethod
    def save_file(file, directory, create_folder=False):
        if not os.path.exists(directory):
            if create_folder is False:
                raise ValueError('Error: cannot find path: ' + directory)

        try:
            pathlib.Path(directory).mkdir(parents=True, exist_ok=True)
            file.save(os.path.join(directory, file.filename))
            return str(os.path.join(directory, file.filename))
        except OSError as oserr:
            pprint(oserr)

export const openFileDialog = (extensions) =>
    new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        if (extensions) {
            if (extensions instanceof Array) {
                input.accept = extensions.map(e => `.${e}`).join(',');
            } else {
                input.accept = extensions.toString();
            }
        }

        let files;

        const returnFiles = () => {
            if (files && files.length > 0) {
                resolve(files);
            } else {
                resolve(null);
            }
        };

        const pressedCancel = () => {
            // 300ms is obviously a hack, but that's because we are dangerous h4ckx0rKidzZ!
            setTimeout(() => {
                returnFiles();
            }, 300);
            window.removeEventListener('focus', pressedCancel);
        }

        input.addEventListener('change', event => {
            files = event.target.files;
            window.removeEventListener('focus', pressedCancel);
        });

        window.addEventListener('focus', pressedCancel);

        input.click();
    });

export const asFormData = (files) => {
    const formData = new FormData();
    if (!files) {
        formData.append("files", null);
        return formData;
    }
    for (const file of files) {
        formData.append('files', file, file.name);
    }
    return formData;
};

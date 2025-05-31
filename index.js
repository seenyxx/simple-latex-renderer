document.addEventListener('DOMContentLoaded', () => {
    const latexInput = document.getElementById('latexInput');
    const outputDiv = document.getElementById('output');
    const exportTransparentPNGButton = document.getElementById('exportTransparentPNG');
    const exportOpaquePNGButton = document.getElementById('exportOpaquePNG');
    const bgToggleWhiteButton = document.getElementById('bgToggleWhite');
    const bgToggleBlackButton = document.getElementById('bgToggleBlack');

    let exportBackgroundColor = 'white'; // Default opaque background color

    // --- Utility Functions ---
    const getTimestampFilename = (prefix, extension) => {
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        return `${prefix}_${ts}.${extension}`;
    };

    const triggerDownload = (uri, filename) => {
        const link = document.createElement('a');
        link.href = uri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- KaTeX Rendering ---
    const renderLatex = () => {
        const latexCode = latexInput.value.trim();
        outputDiv.innerHTML = ''; // Clear previous output

        if (latexCode === '') {
            outputDiv.innerHTML = '<span class="text-gray-500">Preview will appear here...</span>';
            return;
        }

        try {
            const html = katex.renderToString(latexCode, {
                throwOnError: true,
                displayMode: true,
            });
            outputDiv.innerHTML = html;
        } catch (err) {
            outputDiv.innerHTML = `<span class="text-red-400">Error: ${err.message}</span>`;
            console.error("KaTeX rendering error:", err);
        }
    };

    let renderTimeout;
    latexInput.addEventListener('input', () => {
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(renderLatex, 300);
    });

    if (latexInput.value) {
        renderLatex();
    } else {
        outputDiv.innerHTML = '<span class="text-gray-500">Preview will appear here...</span>';
    }

    // --- Background Toggle Logic ---
    bgToggleWhiteButton.addEventListener('click', () => {
        exportBackgroundColor = 'white';
        bgToggleWhiteButton.classList.add('ring-2', 'ring-offset-2', 'ring-offset-gray-800', 'ring-blue-500');
        bgToggleBlackButton.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-gray-800', 'ring-blue-500');
    });

    bgToggleBlackButton.addEventListener('click', () => {
        exportBackgroundColor = 'black';
        bgToggleBlackButton.classList.add('ring-2', 'ring-offset-2', 'ring-offset-gray-800', 'ring-blue-500');
        bgToggleWhiteButton.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-gray-800', 'ring-blue-500');
    });

    bgToggleWhiteButton.click();

    // --- Export PNG Functions ---

    function exportPNG(isTransparent) {
        if (!outputDiv.innerHTML.trim() || outputDiv.innerHTML.includes('Preview will appear here')) {
            alert('Nothing to export!');
            return;
        }

        const clone = outputDiv.cloneNode(true);

        // Set background and text color based on transparent or opaque mode
        if (isTransparent) {
            clone.style.backgroundColor = 'transparent';
            clone.style.color = 'black';  // You can adjust default text color here for transparent bg
        } else {
            clone.style.backgroundColor = exportBackgroundColor;
            clone.style.color = (exportBackgroundColor === 'black') ? 'white' : 'black';
        }

        clone.style.border = 'none';
        clone.style.borderRadius = '0';
        clone.style.padding = '10px';  // keep padding consistent
        clone.style.width = outputDiv.offsetWidth + 'px';
        clone.style.height = outputDiv.offsetHeight + 'px';

        clone.style.position = 'fixed';
        clone.style.top = '-9999px';
        clone.style.left = '-9999px';
        clone.style.zIndex = '-1000';
        clone.style.boxSizing = 'border-box';

        document.body.appendChild(clone);

        html2canvas(clone, {
            backgroundColor: isTransparent ? null : exportBackgroundColor,
            scale: 3,
            useCORS: true,
        }).then(canvas => {
            const pngURI = canvas.toDataURL('image/png');
            triggerDownload(pngURI, getTimestampFilename('latex_export', 'png'));
        }).catch(err => {
            console.error('html2canvas error:', err);
            alert('Failed to export PNG image.');
        }).finally(() => {
            document.body.removeChild(clone);
        });
    }

    exportTransparentPNGButton.addEventListener('click', () => exportPNG(true));
    exportOpaquePNGButton.addEventListener('click', () => exportPNG(false));
});

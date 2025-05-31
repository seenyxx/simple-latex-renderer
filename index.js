
document.addEventListener('DOMContentLoaded', () => {
    const latexInput = document.getElementById('latexInput');
    const outputDiv = document.getElementById('output');
    const exportTransparentPNGButton = document.getElementById('exportTransparentPNG');
    const exportOpaquePNGButton = document.getElementById('exportOpaquePNG');
    const bgToggleWhiteButton = document.getElementById('bgToggleWhite');
    const bgToggleBlackButton = document.getElementById('bgToggleBlack');

    let exportBackgroundColor = 'white';
    
    let exportScale = 2.0;

    const scaleSlider = document.getElementById('scaleSlider');
    const scaleValue = document.getElementById('scaleValue');

    scaleSlider.addEventListener('input', () => {
        exportScale = parseFloat(scaleSlider.value);
        scaleValue.textContent = `${exportScale.toFixed(1)}×`;
    });


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

    const renderLatex = () => {
        const latexCode = latexInput.value.trim();
        outputDiv.innerHTML = '';

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

    async function exportPNG(isTransparent) {
        if (!outputDiv.innerHTML.trim() || outputDiv.innerHTML.includes('Preview will appear here')) {
            alert('Nothing to export!');
            return;
        }

        await document.fonts.ready;

        const clone = outputDiv.cloneNode(true);
        clone.style.backgroundColor = isTransparent ? 'transparent' : exportBackgroundColor;
        clone.style.color = isTransparent ? 'black' : (exportBackgroundColor === 'black' ? 'white' : 'black');
        clone.style.padding = '10px';
        clone.style.width = outputDiv.offsetWidth + 'px';
        clone.style.height = outputDiv.offsetHeight + 'px';
        clone.style.boxSizing = 'border-box';
        clone.style.border = 'none';
        clone.style.borderRadius = '0';

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-10000px';
        container.style.left = '-10000px';
        container.appendChild(clone);
        document.body.appendChild(container);

        try {
            const dataUrl = await modernScreenshot.domToPng(clone, {
                scale: exportScale,
                fetch: {
                    requestInit: { mode: 'cors' },
                    bypassingCache: true,
                },
            });
            triggerDownload(dataUrl, getTimestampFilename('latex-export', 'png'));
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export image.');
        } finally {
            document.body.removeChild(container);
        }
    }

    exportTransparentPNGButton.addEventListener('click', () => exportPNG(true));
    exportOpaquePNGButton.addEventListener('click', () => exportPNG(false));
});

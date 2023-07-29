
/**
 * Class for creating HTML output which contains the mermaid diagram and the process elements.
 */
class HTMLOutput {
    constructor() {
        this.projectName = 'Dummy Project';
        this.charts = [];
    }

    /**
     * Adds the mermaid diagram to the HTML output.
     * @param {Object} data - The data object containing the name, projectName, and mermaidData of the diagram.
     * @param {string} data.name - The name of the diagram.
     * @param {string} data.projectName - The name of the project.
     * @param {string} data.mermaidData - The mermaid data of the diagram.
     */
    addDiagram(data) {
        const { name, projectName, mermaidData } = data;
        this.charts.push(data);
    }

    setProjectName(projectName = 'Dummy Project') {
        this.projectName = projectName;
    }

    /**
     * Adds HTML elements to the output.
     * @returns {string} - The HTML elements as a string.
     */
    addHtmlElementsMermaid() {
        let ret = ``;
        for (const [index, chart] of this.charts.entries()) {
            ret += `<h2>${chart.name}</h2>\n`;
            ret += `<pre id="chart${index}" class="mermaid">${chart.mermaidData}</pre>\n`;
        }
        return ret;
    }

    addHtmlElementsPNG() {
        let ret = ``;
        for (const [index, chart] of this.charts.entries()) {
            ret += `<h2>${chart.name}</h2>\n`;
            ret += `<img id="chart${index}" src="./${chart.name}.mmd.png">\n`;
        }
        return ret;
    }

    addHtmlElementsSVG() {
        let ret = ``;
        for (const [index, chart] of this.charts.entries()) {
            ret += `<h2>${chart.name}</h2>\n`;
            ret += `<img id="chart${index}" src="./${chart.name}.mmd.svg">\n`;
        }
        return ret;
    }    

    addTableOfContents() {
        let ret = ``;
        ret += `<h2 style="text-align: center;">Table of Contents</h2>\n`;
        ret += `<ul style="list-style-type: none; padding-left: 0; margin-bottom: 20px;">\n`;
        for (const [index, chart] of this.charts.entries()) {
            ret += `<li style="margin-bottom: 10px;"><a href="#chart${index}" style="text-decoration: none; color: #0078d4;">${chart.name}</a></li>\n`;
        }
        ret += `</ul>\n`;
        ret += `<hr style="border: none; border-top: 1px solid #ddd; margin-bottom: 20px;">\n`;
        return ret;
    }

    /**
     * Generates the HTML template for the output.
     * @returns {string} - The HTML template as a string.
     */
    HTMLTemplateMermaid() {
        let html = `<html>
        <script type="text/javascript">
            $(function() {
                $("#chart1").load("LB_LDAP_Search_PROD.mmd");
            })
        </script>
      <body>
        <h1>${this.projectName}</h1>
        ${this.addTableOfContents()}
        ${this.addHtmlElementsMermaid()}
        <script type="module">
          import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
          mermaid.initialize({ startOnLoad: true });
        </script>
      </body>
    </html>`;
        return html;
    }

    HTMLTemplatePNG() {
        let html = `<html>
      <body>
        <h1>${this.projectName}</h1>
        ${this.addTableOfContents()}
        ${this.addHtmlElementsPNG()}
      </body>
    </html>`;
        return html;
    }

    HTMLTemplateSVG() {
        let html = `<html>
      <body>
        <h1>${this.projectName}</h1>
        ${this.addTableOfContents()}
        ${this.addHtmlElementsSVG()}
      </body>
    </html>`;
        return html;
    }    
}




module.exports = HTMLOutput;

const localUtils = {

}
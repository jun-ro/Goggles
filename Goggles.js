const puppeteer = require("puppeteer");

class StudentVueAPI {
  constructor() {
    this.occupied = false;
    this.browser;
    this.page;
  }

  reset(){
    this.occupied = false;
    this.browser = null;
    this.page = null;
  }

  async launchStudentVue(user, password) {
    if (this.occupied === true) {
      console.error(
        "Puppeteer is currently doing a task! Can not do simultaneous tasks!"
      );
      return;
    }

    this.occupied = true;

    var grades;

    // Instanciate a new browser to start scraping data

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the login page for MCPS StudentVue.

    await page.goto("https://md-mcps-psv.edupoint.com/PXP2_Login_Student.aspx");

    // Start Logging in

    await page.focus('input[name="ctl00\\$MainContent\\$username"]');
    await page.type('input[name="ctl00\\$MainContent\\$username"]', user);
    await page.focus('input[name="ctl00\\$MainContent\\$password"]');
    await page.type('input[name="ctl00\\$MainContent\\$password"]', password);
    await page.click(
      'input[type="submit"][name="ctl00\\$MainContent\\$Submit1"]'
    );

    this.browser = browser;
    this.page = page;
  }

  async getGradeBook(user, password) {
    var grades;
    await this.launchStudentVue(user, password);

    try {
      await this.page.waitForSelector('.lp-tile[data-bind="click: launch"]', {
        timeout: 3000,
      }); // Adjust timeout as needed
    } catch (error) {
      console.error(
        "Selector not found within the timeout period, probably invalid credentials"
      );
      await this.browser.close();
      this.occupied = false;
      return {
        error:
          "Selector not found within the timeout period, probably invalid credentials",
      };
    }

    const buttons = await this.page.evaluate(() => {
      let returnStatement = null; // Initialize returnStatement to null

      const elements = document.getElementsByClassName(
        "lp-tile flexbox vertical auto middle"
      );

      for (let i = 0; i < elements.length; i++) {
        const specificElement = elements[i];
        const titleElement = specificElement.querySelector(".title");
        if (titleElement.textContent.trim() == "Grade Book") {
          specificElement.click();
          break;
        }
      }
    });

    // We are now in Gradebook, time to start scraping data!

    await this.page.waitForNavigation();

    const ClassData = await this.page.evaluate(() => {
      var dataGuids = [];
      var ClassNames = [];
      var Marks = [];
      var returnStatement = {};

      const nameElements = document.getElementsByClassName(
        "row gb-class-header gb-class-row flexbox horizontal"
      );
      const gradeElements = document.getElementsByClassName("row gb-class-row");

      for (let i = 0; i < nameElements.length; i++) {
        const specificElement = nameElements[i];
        const rowElement = specificElement.querySelector(`div[scope="row"]`);
        const titleElement = rowElement.firstElementChild;
        dataGuids.push(specificElement.getAttribute("data-guid").toString());
        ClassNames.push(titleElement.textContent.trim());
      }

      for (let i = 0; i < gradeElements.length; i++) {
        const specificGradeElements = gradeElements[i];
        const specificGradeId = specificGradeElements.getAttribute("data-guid");
        const dataElements = specificGradeElements.children[0];
        const gradeDetails = dataElements.children[1];
        if (gradeDetails && gradeDetails.children[1]) {
          const mark = gradeDetails.children[1].textContent.trim();
          Marks.push(mark);
        }
      }

      for (let i = 0; i < ClassNames.length; i++) {
        returnStatement[ClassNames[i]] = [dataGuids[i], Marks[i]];
      }

      return returnStatement;
    });

    this.browser.close();
    this.reset();
    return await ClassData;
  }

  async getAssignmentDetails(user, password, guid) {
    await this.launchStudentVue(user, password);
    await this.page.setViewport({ width: 1920, height: 1080 });

    try {
      await this.page.waitForSelector('.lp-tile[data-bind="click: launch"]', {
        timeout: 3000,
      }); // Adjust timeout as needed
    } catch (error) {
      console.error(
        "Selector not found within the timeout period, probably invalid credentials"
      );
      await this.browser.close();
      this.occupied = false;
      return {
        error:
          "Selector not found within the timeout period, probably invalid credentials",
      };
    }

    const buttons = await this.page.evaluate(() => {
      let returnStatement = null; // Initialize returnStatement to null

      const elements = document.getElementsByClassName(
        "lp-tile flexbox vertical auto middle"
      );

      for (let i = 0; i < elements.length; i++) {
        const specificElement = elements[i];
        const titleElement = specificElement.querySelector(".title");
        if (titleElement.textContent.trim() == "Grade Book") {
          specificElement.click();
          break;
        }
      }
    });

    await this.page.waitForNavigation();

    const clickOnClass = await this.page.evaluate((guid) => {
      const classes = document.getElementsByClassName(
        "row gb-class-header gb-class-row flexbox horizontal"
      );
      for (var i = 0; i < classes.length; i++) {
        if (classes[i].getAttribute("data-guid") === guid) {
          classes[i].firstElementChild.firstElementChild.click();
          break;
        }
      }
    }, guid);

    const getAssignmentView = await this.page.evaluate(async () => {
      const response = await fetch(
        "https://md-mcps-psv.edupoint.com/api/GB/ClientSideData/Transfer?action=pxp.course.content.items-LoadWithOptions",
        {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json; charset=UTF-8",
            current_web_portal: "StudentVUE",
            "sec-ch-ua": '"Chromium";v="109", "Not_A Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
          },
          referrer:
            "https://md-mcps-psv.edupoint.com/PXP2_GradeBook.aspx?AGU=0",
          referrerPolicy: "strict-origin-when-cross-origin",
          body: '{"FriendlyName":"pxp.course.content.items","Method":"LoadWithOptions","Parameters":"{\\"loadOptions\\":{\\"sort\\":[{\\"selector\\":\\"due_date\\",\\"desc\\":false}],\\"filter\\":[[\\"isDone\\",\\"=\\",false]],\\"group\\":[{\\"Selector\\":\\"Week\\",\\"desc\\":false}],\\"requireTotalCount\\":true,\\"userData\\":{}},\\"clientState\\":{}}"}',
          method: "POST",
          mode: "cors",
          credentials: "include",
        }
      );

      // Time to format the data

      const { responseData } = await response.json();

      const formattedData = {};

      for (const { items } of responseData.data) {
        for (const assignment of items) {
          formattedData[assignment.title] = {
            Grade: parseInt(assignment.gradeMark),
            MaxGrade: parseInt(assignment.pointsPossible),
            Type: assignment.assignmentType,
          };
        }
      }

      return formattedData
    });

    await this.browser.close();
    this.reset();
    return await getAssignmentView
  }
}

module.exports = StudentVueAPI;

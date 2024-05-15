const puppeteer = require("puppeteer");

class StudentVueAPI {
  constructor() {
    this.instances = [];
    this.enums = {
      errorMessage: "Selector not found within the timeout period, probably invalid credentials",
      synergyMailClass: `.lp-tile[data-bind="click: launch"]`,
      defaultSynergyButtonsClass: `lp-tile flexbox vertical auto middle`,
      GradeBook: "Grade Book",
      GradeBookElements: {
        classNameElements: "row gb-class-header gb-class-row flexbox horizontal",
        gradeMarkElements: "row gb-class-row",
      }
    }
  }


  // Helper Functions

  async launchStudentVue(user, password) {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on("request", (req) => {
      if (req.resourceType() == "font" || req.resourceType() == "image") {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto("https://md-mcps-psv.edupoint.com/PXP2_Login_Student.aspx");
    await page.focus('input[name="ctl00\\$MainContent\\$username"]');
    await page.type('input[name="ctl00\\$MainContent\\$username"]', user);
    await page.focus('input[name="ctl00\\$MainContent\\$password"]');
    await page.type('input[name="ctl00\\$MainContent\\$password"]', password);
    await page.click(
      'input[type="submit"][name="ctl00\\$MainContent\\$Submit1"]'
    );

    return { browser, page };
  }

  async closeInstance(instance) {
    await instance.page.close();
    await instance.browser.close();
  }

  async checkLogin(instance, timeoutTime) {
    try {
      await instance.page.waitForSelector(this.enums.synergyMailClass, {timeout: timeoutTime}); // Adjust timeout as needed
    } catch (error) {
      console.error(this.enums.errorMessage);
      this.closeInstance(instance);
      return {error: this.enums.errorMessage,};
    }
  }

  async goToPage(instance, nameOfPage) {
    await instance.page.evaluate((nameOfPage, enums) => {
      const elements = document.getElementsByClassName(enums.defaultSynergyButtonsClass);

      for (let i = 0; i < elements.length; i++) {
        const specificElement = elements[i];
        const titleElement = specificElement.querySelector(".title");
        if (titleElement.textContent.trim() == nameOfPage) {
          specificElement.click();
          break;
        }
      }
    }, nameOfPage, this.enums);

    await instance.page.waitForNavigation();
  }

  // Main Functions (for the API)

  async getGradeBook(user, password) {
    const { browser, page } = await this.launchStudentVue(user, password);

    await this.checkLogin({ browser, page }, 3000);
    await this.goToPage({ browser, page }, this.enums.GradeBook);

    // We are now in Gradebook, time to start scraping data!

    const ClassData = await page.evaluate((enums) => {
      var dataGuids = [];
      var ClassNames = [];
      var Marks = [];
      var returnStatement = {};

      const nameElements = document.getElementsByClassName(enums.GradeBookElements.classNameElements);
      const gradeElements = document.getElementsByClassName(enums.GradeBookElements.gradeMarkElements);

      for (let i = 0; i < nameElements.length; i++) {
        const specificElement = nameElements[i];
        const rowElement = specificElement.firstElementChild;
        const titleElement = rowElement.firstElementChild;
        dataGuids.push(specificElement.getAttribute("data-guid").toString());
        ClassNames.push(titleElement.textContent.trim());
      }

      for (let i = 0; i < gradeElements.length; i++) {
        const specificGradeElements = gradeElements[i];
        const specificGradeId = specificGradeElements.getAttribute("data-guid");
        const dataElements = specificGradeElements.firstElementChild
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
    }, this.enums);

    this.closeInstance({ browser, page });
    return await ClassData;
  }

  async getAssignmentDetails(user, password, guid) {
    const { browser, page } = await this.launchStudentVue(user, password);

    await this.checkLogin({ browser, page }, 3000);
    await this.goToPage({ browser, page }, "Grade Book");

    await page.evaluate((guid, enums) => {
      const classes = document.getElementsByClassName(enums.GradeBookElements.classNameElements);
      for (var i = 0; i < classes.length; i++) {
        if (classes[i].getAttribute("data-guid") === guid) {
          classes[i].firstElementChild.firstElementChild.click();
          break;
        }
      }
    }, guid, this.enums);

    const getAssignmentView = await page.evaluate(async () => {
      const response = await fetch(
        "https://md-mcps-psv.edupoint.com/api/GB/ClientSideData/Transfer?action=pxp.course.content.items-LoadWithOptions",
        {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json; charset=UTF-8",
            current_web_portal: "StudentVUE",
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

      return formattedData;
    });

    await this.closeInstance({ browser, page });
    return await getAssignmentView;
  }
}

module.exports = StudentVueAPI;

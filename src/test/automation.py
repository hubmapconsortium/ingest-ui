from selenium import webdriver
from getpass import getpass
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import unittest
from selenium.common.exceptions import TimeoutException
from random import randint

url = "https://ingest.test.hubmapconsortium.org"
username = "del20"

class CreateDonor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.driver = webdriver.Chrome()
        print("Go to localhost:3000")
        cls.driver.get(url)

        print("Click on login button")
        loginBtn = cls.driver.find_element_by_xpath('//*[@id="content"]/div/div/a')
        loginBtn.click()

        print("Select University of Pittsburgh as ID provider")
        providerSelect = cls.driver.find_element_by_xpath('//*[@id="main-form"]/div[2]/div[1]').click()
        upittOption = cls.driver.find_element_by_xpath('//*[@id="main-form"]/div[2]/div[2]/div/div[@data-value="university_of_pittsburgh"]').click()
        continueBtn = cls.driver.find_element_by_xpath('//*[@id="login-btn"]').click()

        print("Fill in PITT username")
        usernameInput = cls.driver.find_element_by_xpath('//*[@id="username"]').send_keys(username)
        print("Fill in PITT password")
        passwordInput = cls.driver.find_element_by_xpath('//*[@id="password"]').send_keys(getpass())
        print("Click Submit")
        submitBtn = cls.driver.find_element_by_xpath('//*[@id="shibboleth-app"]/div/div/div[1]/div/form/button').click()
    
    def test_create_donor(self):
        try:
            element = WebDriverWait(self.driver, 30).until(EC.title_contains("HuBMAP"))
            
            self.assertIn("HuBMAP", self.driver.title)

            enterBtn = WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.XPATH, '//*[@id="content"]/div/div/div[1]/div/div/button'))).click()
            createBtn = self.driver.find_element_by_xpath('//*[@id="dropdownMenuButton"]').click()
            donorBtn = self.driver.find_element_by_xpath('//*[@id="content"]/div/div[2]/div[1]/div/div/button[1]').click()

            deid_name = f"Test Donor #{randint(1000, 9999)}"
            deidNameInput = self.driver.find_element_by_xpath('//*[@id="identifying_name"]').send_keys(deid_name)
            protocal_url = 'dx.doi.org/10.17504/protocols.io.p9kdr4w'
            protocalInput = self.driver.find_element_by_xpath('//*[@id="protocol"]').send_keys(protocal_url)

            submitBtn = self.driver.find_element_by_xpath('//*[@id="content"]/div/div[2]/div[2]/div/div[2]/div/form/div[9]/div[1]/button').click()

            successMsg = WebDriverWait(self.driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div.alert-success'))).text
            self.assertIn("was generated", successMsg)

            returnBtn = self.driver.find_element_by_xpath('//*[@id="content"]/div/div[2]/div[2]/div/div[3]/div/button').click()
            table = WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.XPATH, '//*[@id="content"]/div/div[2]/div[2]/div/div/table')))
            
            firstDonorName = self.driver.find_element_by_xpath('//*[@id="content"]/div/div[2]/div[2]/div/div/table/tbody/tr[1]/td[4]').text
            self.assertIn(deid_name, firstDonorName)

        except TimeoutException as te:
            print("Fail") 

    def test_update_donor(self):
        try:
            editBtn = self.driver.find_element_by_xpath('//*[@id="content"]/div/div[2]/div[2]/div/div/table/tbody/tr[1]/td[6]/button[1]').click()
            descriptionInput = WebDriverWait(self.driver, 30).until(EC.presence_of_element_located((By.XPATH, '//*[@id="description"]')))
            descriptionInput.send_keys("dummy description")
            submitBtn = self.driver.find_element_by_xpath('//*[@id="content"]/div/div[2]/div[2]/div/div[1]/div[3]/form/div[9]/div[1]/button').click()
            successMsg = WebDriverWait(self.driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div.alert-success')))
            self.assertIn("Updated", successMsg.text)

        except TimeoutException as te:
            print("Fail")

    @classmethod
    def tearDownClass(cls):
        cls.driver.close()

if __name__ == "__main__":
    unittest.main()
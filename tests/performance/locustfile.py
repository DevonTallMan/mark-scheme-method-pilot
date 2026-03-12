"""Locust performance test – simulates students browsing MSM."""
from locust import HttpUser, task, between


class StudentUser(HttpUser):
    host = "https://devontallman.github.io/mark-scheme-method-pilot"
    wait_time = between(1, 3)

    @task(3)
    def view_topics(self):
        self.client.get("/topics.html")

    @task(2)
    def view_dashboard(self):
        self.client.get("/dashboard.html")

    @task(1)
    def view_content_area(self):
        self.client.get("/content-areas/classroom-611-v3.html")

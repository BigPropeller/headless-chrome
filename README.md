# Gain headless-chrome
Headless chrome using Puppeteer that can run on Google App Engine, modified for Gain


## Before deploying

Ask a Gain administrator to provide you with the following:

- A copy of the files `app.yaml` and `staging.yaml` which are not commited to the repo. Copy these files to the root of this project.
- Access to Gain's Google App Engine account, and the `gain-headless-chrome` project within it

## Preparing the Google CLI

1. Download and install the Google Cloud Engine CLI, currently available at https://cloud.google.com/sdk/docs/install

2. Configure your CLI by running `gcloud init`. You will be asked to log in to your Google account.

3. You will also be asked to select the cloud project you wish to use from a list. Select the number corresponding to the `gain-headless-chrome` cloud project.

## Deploying

This repo is configured to deploy to two services within the `gain-headless-chrome` cloud project:

- The *default* (production) service, which is normally accessed through https://gain-headless-chrome.appspot.com/

    - **To deploy to production:** run `gcloud app deploy app.yaml`


- The *staging* service, which is normally accessed through https://staging-dot-gain-headless-chrome.appspot.com/ and is used for testing before going to production.

    - **To deploy to staging:** run `gcloud app deploy staging.yaml`

### Warning!

Deploying to any of the environments will immediately deploy the code you have saved in this directory right now. It doesn't matter if the code has been commited to the git repo or not. Be careful when deploying any changed code, especially when deploying to production.

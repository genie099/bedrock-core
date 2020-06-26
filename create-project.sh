#!/bin/bash

echo "Create a new Bedrock project:"
echo ""
read -p "Enter project name: " project
read -p "Enter domain: http://" domain
read -p "Enter git remote (owner/repository): " git_remote
read -p "Enter email (optional): " email
read -p "Enter address (optional): " address

if [ "$project" == "" ]; then
  echo ""
  echo "Project required! Exiting..."
  exit 1
elif [ "$domain" == "" ]; then
  echo ""
  echo "Domain required! Exiting..."
  exit 1
elif [ "$git_remote" == "" ]; then
  echo ""
  echo "Git remote required! Exiting..."
  exit 1
fi

kebab=`echo "$project" | tr '[:upper:]' '[:lower:]' | sed -e 's/\ /-/g'`
under=`echo "$project" | tr '[:upper:]' '[:lower:]' | sed -e 's/\ /_/g'`
steps=45
current=0

replace() {
  sed -i '' "s:bedrockio/bedrock-core:$git_remote:g" $1
  sed -i '' "s/bedrock_dev/$under\_dev/g" $1
  sed -i '' "s/bedrock_staging/$under\_staging/g" $1
  sed -i '' "s/bedrock_production/$under\_production/g" $1
  sed -i '' "s/bedrock-staging/$kebab-staging/g" $1
  sed -i '' "s/bedrock-production/$kebab-production/g" $1
  sed -i '' "s/bedrock-core-services/$kebab-services/g" $1
  sed -i '' "s/bedrock-foundation/$kebab/g" $1
  sed -i '' "s/bedrock-web/$kebab-web/g" $1
  sed -i '' "s/bedrock-api/$kebab-api/g" $1
  sed -i '' "s/admin@bedrock\.foundation/$email/g" $1
  sed -i '' "s/bedrock\.foundation/$domain/g" $1
  sed -i '' "s/APP_COMPANY_ADDRESS=.*/APP_COMPANY_ADDRESS=$address/g" $1
  sed -i '' "s/Bedrock/$project/g" $1
  sed -i '' "s/bedrock/$kebab/g" $1
  update
}

remove() {
  rm -rf $1
  update
}

update() {
  current=$((current+1))
  pct=$(($current * 100 / $steps))
  rem=$(($steps - $current))
  bar=$(seq -s# $current|tr -d '[:digit:]')
  spaces=$(seq -s\  $rem|tr -d '[:digit:]')
  echo -ne "$bar$spaces ($pct%)\r"
}

echo "Creating Project..."
update

git clone git@github.com:bedrockio/bedrock-core.git $kebab
update

replace ./$kebab/docker-compose.yml

replace ./$kebab/services/api/env.conf
replace ./$kebab/services/api/package.json
replace ./$kebab/services/api/README.md
replace ./$kebab/services/web/env.conf
replace ./$kebab/services/web/package.json
replace ./$kebab/services/web/README.md
replace ./$kebab/services/web/src/utils/README.md
replace ./$kebab/services/web/src/components/README.md
replace ./$kebab/services/api-docs/package.json

replace ./$kebab/deployment/README.md
replace ./$kebab/deployment/staging/env.conf
replace ./$kebab/deployment/staging/services/api-cli-deployment.yml
replace ./$kebab/deployment/staging/services/api-deployment.yml
replace ./$kebab/deployment/staging/services/api-docs-deployment.yml
replace ./$kebab/deployment/staging/services/api-docs-service.yml
replace ./$kebab/deployment/staging/services/api-jobs-deployment.yml
replace ./$kebab/deployment/staging/services/api-service.yml
replace ./$kebab/deployment/staging/services/web-deployment.yml
replace ./$kebab/deployment/staging/services/web-service.yml
replace ./$kebab/deployment/staging/data/backup-monitor-deployment.yml
replace ./$kebab/deployment/staging/data/bucket-storage-backups-deployment.yml
replace ./$kebab/deployment/staging/data/elasticsearch-deployment.yml
replace ./$kebab/deployment/staging/data/elasticsearch-service.yml
replace ./$kebab/deployment/staging/data/mongo-backups-deployment.yml
replace ./$kebab/deployment/staging/data/mongo-deployment.yml
replace ./$kebab/deployment/staging/data/mongo-service.yml

replace ./$kebab/deployment/production/env.conf
replace ./$kebab/deployment/production/services/api-cli-deployment.yml
replace ./$kebab/deployment/production/services/api-deployment.yml
replace ./$kebab/deployment/production/services/api-docs-deployment.yml
replace ./$kebab/deployment/production/services/api-docs-service.yml
replace ./$kebab/deployment/production/services/api-jobs-deployment.yml
replace ./$kebab/deployment/production/services/api-service.yml
replace ./$kebab/deployment/production/services/web-deployment.yml
replace ./$kebab/deployment/production/services/web-service.yml
replace ./$kebab/deployment/production/data/backup-monitor-deployment.yml
replace ./$kebab/deployment/production/data/bucket-storage-backups-deployment.yml
replace ./$kebab/deployment/production/data/elasticsearch-deployment.yml
replace ./$kebab/deployment/production/data/elasticsearch-service.yml
replace ./$kebab/deployment/production/data/mongo-backups-deployment.yml
replace ./$kebab/deployment/production/data/mongo-deployment.yml
replace ./$kebab/deployment/production/data/mongo-service.yml

remove ./$kebab/create-project.sh
remove ./$kebab/CONTRIBUTING.md
remove ./$kebab/LICENSE
remove ./$kebab/.git

if [ "$git_remote" != "" ]; then
  pushd ./$kebab > /dev/null
  git init
  git remote add origin git@github.com:$git_remote.git
  git add .
  git commit -m "Initial Commit"
  git push -u --force origin master
  popd
fi

echo ""
echo "Done!"

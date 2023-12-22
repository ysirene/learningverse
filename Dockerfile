# Base image
FROM node:20

# 建立容器運行的應用程式目錄
WORKDIR /usr/src/app

# 複製套件的清單到docker的目錄中
COPY package*.json ./

# 安裝所需套件
RUN npm install

# 複製當前的專案到docker的目錄中
COPY . .

# port
EXPOSE 5001

# 運行程式碼
CMD ["node", "app.js"]
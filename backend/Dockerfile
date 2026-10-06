# Stage 1: Build the JAR
FROM maven:3.9-eclipse-temurin-26 AS build
WORKDIR /src
COPY . .
RUN mvn clean package -DskipTests

# Stage 2: Run the JAR
FROM eclipse-temurin:26-jre
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
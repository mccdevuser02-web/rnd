#include <iostream>
#include <vector>
#include <string>
#include <random>

// Define the struct
struct Data {
    int id;
    std::string name;
};

int main() {
    // Create a vector of 10 structs
    std::vector<Data> dataVector(10);
    
    // Create random number generators
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> idDist(1, 100);
    std::uniform_int_distribution<> nameLengthDist(3, 10);
    
    // Fill the vector with random data
    for (auto& data : dataVector) {
        data.id = idDist(gen);
        
        // Generate a random string of letters
        std::string name;
        const std::string chars = "abcdefghijklmnopqrstuvwxyz";
        std::uniform_int_distribution<> charDist(0, chars.length() - 1);
        int length = nameLengthDist(gen);
        for (int i = 0; i < length; ++i) {
            name += chars[charDist(gen)];
        }
        data.name = name;
    }
    
    // Display the contents
    std::cout << "Vector contents:\n";
    for (const auto& data : dataVector) {
        std::cout << "ID: " << data.id << ", Name: " << data.name << "\n";
    }
    
    return 0;
}
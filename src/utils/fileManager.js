const fs = require('fs').promises;
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);

class FileManager {
    constructor() {
        this.baseDir = process.cwd();
        this.tempDir = path.join(this.baseDir, 'data', 'temp');
        this.ensureTempDir();
    }

    async ensureTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('Error creating temp directory:', error);
        }
    }

    async readFile(filePath, encoding = 'utf8') {
        try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);
            const data = await fs.readFile(absolutePath, encoding);
            return data;
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    async writeFile(filePath, data, encoding = 'utf8') {
        try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);
            
            // Ensure directory exists
            const dir = path.dirname(absolutePath);
            await fs.mkdir(dir, { recursive: true });
            
            await fs.writeFile(absolutePath, data, encoding);
            return true;
        } catch (error) {
            console.error('Error writing file:', error);
            throw error;
        }
    }

    async appendToFile(filePath, data, encoding = 'utf8') {
        try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);
            
            // Ensure directory exists
            const dir = path.dirname(absolutePath);
            await fs.mkdir(dir, { recursive: true });
            
            await fs.appendFile(absolutePath, data, encoding);
            return true;
        } catch (error) {
            console.error('Error appending to file:', error);
            throw error;
        }
    }

    async deleteFile(filePath) {
        try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);
            await fs.unlink(absolutePath);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    async fileExists(filePath) {
        try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);
            await fs.access(absolutePath);
            return true;
        } catch {
            return false;
        }
    }

    async getFileStats(filePath) {
        try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);
            const stats = await fs.stat(absolutePath);
            return {
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory()
            };
        } catch (error) {
            console.error('Error getting file stats:', error);
            return null;
        }
    }

    async listFiles(directoryPath, options = {}) {
        try {
            const absolutePath = path.isAbsolute(directoryPath) ? directoryPath : path.join(this.baseDir, directoryPath);
            const files = await fs.readdir(absolutePath, { withFileTypes: true });
            
            let result = files.map(file => ({
                name: file.name,
                path: path.join(absolutePath, file.name),
                isDirectory: file.isDirectory(),
                isFile: file.isFile()
            }));

            // Apply filters
            if (options.extension) {
                result = result.filter(file => 
                    file.isFile && path.extname(file.name).toLowerCase() === options.extension.toLowerCase()
                );
            }

            if (options.pattern) {
                const regex = new RegExp(options.pattern);
                result = result.filter(file => regex.test(file.name));
            }

            // Sort results
            if (options.sortBy) {
                result.sort((a, b) => {
                    if (options.sortBy === 'name') {
                        return a.name.localeCompare(b.name);
                    } else if (options.sortBy === 'size' && a.isFile && b.isFile) {
                        return this.getFileStats(a.path).then(statsA => 
                            this.getFileStats(b.path).then(statsB => 
                                (statsA?.size || 0) - (statsB?.size || 0)
                            )
                        );
                    } else if (options.sortBy === 'date') {
                        return this.getFileStats(a.path).then(statsA => 
                            this.getFileStats(b.path).then(statsB => 
                                new Date(statsA?.modifiedAt || 0) - new Date(statsB?.modifiedAt || 0)
                            )
                        );
                    }
                    return 0;
                });
            }

            return result;

        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }

    async createDirectory(dirPath) {
        try {
            const absolutePath = path.isAbsolute(dirPath) ? dirPath : path.join(this.baseDir, dirPath);
            await fs.mkdir(absolutePath, { recursive: true });
            return true;
        } catch (error) {
            console.error('Error creating directory:', error);
            return false;
        }
    }

    async deleteDirectory(dirPath, recursive = false) {
        try {
            const absolutePath = path.isAbsolute(dirPath) ? dirPath : path.join(this.baseDir, dirPath);
            
            if (recursive) {
                await fs.rm(absolutePath, { recursive: true, force: true });
            } else {
                await fs.rmdir(absolutePath);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting directory:', error);
            return false;
        }
    }

    async copyFile(sourcePath, destinationPath) {
        try {
            const absoluteSource = path.isAbsolute(sourcePath) ? sourcePath : path.join(this.baseDir, sourcePath);
            const absoluteDest = path.isAbsolute(destinationPath) ? destinationPath : path.join(this.baseDir, destinationPath);
            
            // Ensure destination directory exists
            const destDir = path.dirname(absoluteDest);
            await this.createDirectory(destDir);
            
            await fs.copyFile(absoluteSource, absoluteDest);
            return true;
        } catch (error) {
            console.error('Error copying file:', error);
            return false;
        }
    }

    async moveFile(sourcePath, destinationPath) {
        try {
            const absoluteSource = path.isAbsolute(sourcePath) ? sourcePath : path.join(this.baseDir, sourcePath);
            const absoluteDest = path.isAbsolute(destinationPath) ? destinationPath : path.join(this.baseDir, destinationPath);
            
            // Ensure destination directory exists
            const destDir = path.dirname(absoluteDest);
            await this.createDirectory(destDir);
            
            await fs.rename(absoluteSource, absoluteDest);
            return true;
        } catch (error) {
            console.error('Error moving file:', error);
            return false;
        }
    }

    async copyDirectory(sourceDir, destinationDir) {
        try {
            const absoluteSource = path.isAbsolute(sourceDir) ? sourceDir : path.join(this.baseDir, sourceDir);
            const absoluteDest = path.isAbsolute(destinationDir) ? destinationDir : path.join(this.baseDir, destinationDir);
            
            // Create destination directory
            await this.createDirectory(absoluteDest);
            
            // Get all files and subdirectories
            const items = await this.listFiles(absoluteSource);
            
            for (const item of items) {
                const sourceItemPath = item.path;
                const destItemPath = path.join(absoluteDest, item.name);
                
                if (item.isDirectory) {
                    await this.copyDirectory(sourceItemPath, destItemPath);
                } else {
                    await this.copyFile(sourceItemPath, destItemPath);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error copying directory:', error);
            return false;
        }
    }

    async getFileInfo(filePath) {
        try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.baseDir, filePath);
            const stats = await this.getFileStats(absolutePath);
            
            if (!stats) return null;
            
            return {
                name: path.basename(absolutePath),
                path: absolutePath,
                extension: path.extname(absolutePath).toLowerCase().replace('.', ''),
                size: stats.size,
                sizeFormatted: this.formatFileSize(stats.size),
                createdAt: stats.createdAt,
                modifiedAt: stats.modifiedAt,
                isDirectory: stats.isDirectory,
                isFile: stats.isFile
            };
        } catch (error) {
            console.error('Error getting file info:', error);
            return null;
        }
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    async createTempFile(extension = 'tmp', data = '') {
        try {
            const filename = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
            const tempPath = path.join(this.tempDir, filename);
            
            await this.writeFile(tempPath, data);
            return tempPath;
        } catch (error) {
            console.error('Error creating temp file:', error);
            throw error;
        }
    }

    async cleanupTempFiles(maxAgeMinutes = 60) {
        try {
            const files = await this.listFiles(this.tempDir);
            const now = Date.now();
            let deletedCount = 0;
            
            for (const file of files) {
                if (file.isFile) {
                    const stats = await this.getFileStats(file.path);
                    if (stats) {
                        const fileAge = (now - new Date(stats.createdAt).getTime()) / (1000 * 60);
                        
                        if (fileAge > maxAgeMinutes) {
                            await this.deleteFile(file.path);
                            deletedCount++;
                        }
                    }
                }
            }
            
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up temp files:', error);
            return 0;
        }
    }

    async searchFiles(directoryPath, searchTerm, options = {}) {
        try {
            const absolutePath = path.isAbsolute(directoryPath) ? directoryPath : path.join(this.baseDir, directoryPath);
            const allFiles = await this.listFiles(absolutePath, { recursive: true });
            
            const results = [];
            
            for (const file of allFiles) {
                if (file.isFile && file.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push(await this.getFileInfo(file.path));
                }
                
                // Limit results if specified
                if (options.maxResults && results.length >= options.maxResults) {
                    break;
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error searching files:', error);
            return [];
        }
    }

    async getDirectorySize(directoryPath) {
        try {
            const absolutePath = path.isAbsolute(directoryPath) ? directoryPath : path.join(this.baseDir, directoryPath);
            const files = await this.listFiles(absolutePath, { recursive: true });
            
            let totalSize = 0;
            
            for (const file of files) {
                if (file.isFile) {
                    const stats = await this.getFileStats(file.path);
                    if (stats) {
                        totalSize += stats.size;
                    }
                }
            }
            
            return {
                bytes: totalSize,
                formatted: this.formatFileSize(totalSize),
                fileCount: files.filter(f => f.isFile).length,
                directoryCount: files.filter(f => f.isDirectory).length
            };
        } catch (error) {
            console.error('Error calculating directory size:', error);
            return { bytes: 0, formatted: '0 Bytes', fileCount: 0, directoryCount: 0 };
        }
    }

    async compressDirectory(sourceDir, outputPath) {
        // This would require a compression library like archiver
        // For now, return a placeholder implementation
        console.log('Compression feature would be implemented here');
        return { success: false, message: 'Compression not implemented' };
    }

    async extractArchive(archivePath, outputDir) {
        // This would require an extraction library like extract-zip or tar
        // For now, return a placeholder implementation
        console.log('Extraction feature would be implemented here');
        return { success: false, message: 'Extraction not implemented' };
    }

    getFileManagerStats() {
        return {
            tempDir: this.tempDir,
            baseDir: this.baseDir,
            platform: process.platform,
            separators: {
                path: path.sep,
                delimiter: path.delimiter
            }
        };
    }
}

module.exports = FileManager;
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Search, MapPin, Users, Clock } from "lucide-react";
import { nyCourses } from "@/data/ny-courses";
import { Course } from "@/types/golf";
import { useToast } from "@/hooks/use-toast";

interface CourseDownloaderProps {
  onCourseSelect: (course: Course) => void;
}

export function CourseDownloader({ onCourseSelect }: CourseDownloaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const { toast } = useToast();

  const filteredCourses = nyCourses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCourseSelection = (courseName: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseName)
        ? prev.filter(name => name !== courseName)
        : [...prev, courseName]
    );
  };

  const downloadSelectedCourses = () => {
    const selectedData = nyCourses.filter(course => 
      selectedCourses.includes(course.name)
    );

    const dataStr = JSON.stringify(selectedData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ny-golf-courses-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Courses Downloaded",
      description: `${selectedCourses.length} courses downloaded successfully`
    });
  };

  const downloadAllCourses = () => {
    const dataStr = JSON.stringify(nyCourses, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-ny-golf-courses-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "All Courses Downloaded",
      description: `${nyCourses.length} NY public courses downloaded`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">New York Public Golf Courses</h2>
          <p className="text-muted-foreground">
            Download course data for {nyCourses.length} public golf courses across New York
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {nyCourses.length} Courses
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Public Access
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated Daily
            </Badge>
          </div>
        </div>
      </Card>

      {/* Search and Actions */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search courses by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadAllCourses} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download All Courses
            </Button>
            <Button 
              variant="outline" 
              onClick={downloadSelectedCourses}
              disabled={selectedCourses.length === 0}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Selected ({selectedCourses.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Course List */}
      <div className="grid gap-4">
        {filteredCourses.map((course) => (
          <Card key={course.name} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{course.name}</h3>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {course.location}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {course.holes.length} Holes
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Par {course.holes.reduce((sum, hole) => sum + hole.par, 0)}</span>
                  <span>GPS Coordinates Available</span>
                  <span>Full Hole Data</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course.name)}
                    onChange={() => toggleCourseSelection(course.name)}
                    className="rounded"
                  />
                  <span className="text-sm">Select</span>
                </label>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCourseSelect(course)}
                >
                  Play Course
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card className="p-8 text-center">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or browse all available courses.
          </p>
        </Card>
      )}
    </div>
  );
}
angular.module('deblur', []);

angular.module('deblur').controller('WorkspaceController', function($scope) {
    $scope.setEraserSize = (size) => App.setEraserSize(size);
    $scope.undoSteps = (numberOfSteps) => App.undoSteps(numberOfSteps);
    $scope.redo = () => App.redo();
    $scope.save = () => App.save();
});
